/**
 * pptx package management — open the zip, archive the original by SHA-256, and read
 * parts and .rels.
 *
 * Byte fidelity: PackageArchive holds the original bytes of every entry; on save,
 * unmodified entries are written back byte-for-byte (handled by the patch layer).
 * This module only handles reading and metadata.
 */
import JSZip from 'jszip'
import { createHash } from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'
import type { SlideSize } from './types'
import { asXmlNode, xmlArray } from './xml-utils'

const relsParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'Relationship' || name === 'sldId' || name === 'Override',
})

export interface Relationship {
  id: string
  type: string
  target: string
  targetMode?: string
}

/** Shared with the CLI's pre-open check so both layers accept the same files. */
export const PPTX_ZIP_LIMITS = {
  maxParts: 10000,
  maxPartBytes: 512 * 1024 * 1024,
  maxTotalBytes: 1.5 * 1024 * 1024 * 1024,
} as const

/** Declared sizes from the central directory, checked before any part is inflated. */
export function assertZipWithinLimits(zip: JSZip): void {
  const files = Object.values(zip.files).filter((f) => !f.dir)
  if (files.length > PPTX_ZIP_LIMITS.maxParts) {
    throw new Error(
      `pptx rejected: ${files.length} parts exceeds the ${PPTX_ZIP_LIMITS.maxParts} limit`,
    )
  }
  let total = 0
  for (const file of files) {
    const size =
      (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0
    if (size > PPTX_ZIP_LIMITS.maxPartBytes) {
      throw new Error(
        `pptx rejected: part ${file.name} declares ${size} uncompressed bytes ` +
          `(limit ${PPTX_ZIP_LIMITS.maxPartBytes})`,
      )
    }
    if (size > 0) total += size
  }
  if (total > PPTX_ZIP_LIMITS.maxTotalBytes) {
    throw new Error(
      `pptx rejected: total uncompressed size ${total} exceeds the ` +
        `${PPTX_ZIP_LIMITS.maxTotalBytes} limit`,
    )
  }
}

class TrackedEntriesMap extends Map<string, Uint8Array> {
  onMutate?: (key?: string) => void
  override set(key: string, value: Uint8Array): this {
    super.set(key, value)
    this.onMutate?.(key)
    return this
  }
  override delete(key: string): boolean {
    const res = super.delete(key)
    if (res) this.onMutate?.(key)
    return res
  }
  override clear(): void {
    super.clear()
    this.onMutate?.()
  }
}

export class PackageArchive {
  private readonly textCache = new Map<string, string>()
  private readonly relsCache = new Map<string, Map<string, Relationship>>()
  private presentationCache?: { size: SlideSize; slidePaths: string[] }

  private constructor(
    private readonly zip: JSZip,
    /** Original bytes of every entry, keyed by path inside the zip */
    readonly entries: Map<string, Uint8Array>,
    readonly originalHash: string,
  ) {
    if (entries instanceof TrackedEntriesMap) {
      entries.onMutate = (key) => {
        this.relsCache.clear()
        this.presentationCache = undefined
        if (key) {
          this.textCache.delete(key)
        } else {
          this.textCache.clear()
        }
      }
    }
  }

  static async open(bytes: Uint8Array): Promise<PackageArchive> {
    const originalHash = createHash('sha256').update(bytes).digest('hex')
    const zip = await JSZip.loadAsync(bytes)
    assertZipWithinLimits(zip)
    const entries = new TrackedEntriesMap()
    const nonDirFiles = Object.entries(zip.files).filter(([, f]) => !f.dir)
    const BATCH_SIZE = 16
    for (let i = 0; i < nonDirFiles.length; i += BATCH_SIZE) {
      const batch = nonDirFiles.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async ([name, file]) => [name, await file.async('uint8array')] as const),
      )
      for (const [name, raw] of results) {
        entries.set(name, raw)
      }
    }
    return new PackageArchive(zip, entries, originalHash)
  }

  has(path: string): boolean {
    return this.entries.has(path)
  }

  /** Read a part as a UTF-8 string (for XML parts). Cached for performance. */
  readText(path: string): string | null {
    const cached = this.textCache.get(path)
    if (cached !== undefined) return cached
    const bytes = this.entries.get(path)
    if (!bytes) return null
    const text = Buffer.from(bytes).toString('utf8')
    this.textCache.set(path, text)
    return text
  }

  readBytes(path: string): Uint8Array | null {
    return this.entries.get(path) ?? null
  }

  /**
   * Read a part's relationships file. partPath e.g. 'ppt/slides/slide1.xml' →
   * 'ppt/slides/_rels/slide1.xml.rels'. Cached for fast repeated lookups across slides.
   */
  readRels(partPath: string): Map<string, Relationship> {
    const cached = this.relsCache.get(partPath)
    if (cached) return cached
    const relsPath = relsPathFor(partPath)
    const rels = new Map<string, Relationship>()
    const xml = this.readText(relsPath)
    if (!xml) {
      this.relsCache.set(partPath, rels)
      return rels
    }
    const doc = asXmlNode(relsParser.parse(xml))
    const list = asXmlNode(doc.Relationships).Relationship
    for (const r of xmlArray(list)) {
      const id = String(r['@_Id'] ?? '')
      rels.set(id, {
        id,
        type: String(r['@_Type'] ?? ''),
        target: String(r['@_Target'] ?? ''),
        ...(r['@_TargetMode'] != null ? { targetMode: String(r['@_TargetMode']) } : {}),
      })
    }
    this.relsCache.set(partPath, rels)
    return rels
  }

  /**
   * Read the presentation's slide size and the slide part paths in order.
   */
  readPresentation(): { size: SlideSize; slidePaths: string[] } {
    if (this.presentationCache) return this.presentationCache
    const presXml = this.readText('ppt/presentation.xml')
    if (!presXml) throw new Error('pptx: missing ppt/presentation.xml')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => name === 'p:sldId',
    })
    const pres = asXmlNode(parser.parse(presXml))
    const rootRaw = pres['p:presentation'] ?? pres.presentation
    if (!rootRaw) throw new Error('pptx: malformed presentation.xml')
    const root = asXmlNode(rootRaw)

    // Slide size
    const szRaw = root['p:sldSz'] ?? root.sldSz
    const sz = szRaw ? asXmlNode(szRaw) : null
    const emuOr = (raw: unknown, fallback: number): number => {
      // A corrupt presentation.xml may carry a missing or non-numeric sldSz;
      // without this guard parseInt yields NaN and poisons every layout.
      const parsed = parseInt(String(raw), 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
    }
    const size: SlideSize = {
      cx: sz ? emuOr(sz['@_cx'], 9144000) : 9144000,
      cy: sz ? emuOr(sz['@_cy'], 6858000) : 6858000,
    }

    // Slide order: presentation.xml.rels maps r:id to slide parts
    const rels = this.readRels('ppt/presentation.xml')
    const sldIdLst = asXmlNode(root['p:sldIdLst'] ?? root.sldIdLst)
    const slidePaths: string[] = []
    for (const id of xmlArray(sldIdLst['p:sldId'])) {
      const rId = id['@_r:id'] ?? id['@_id']
      if (!rId) continue
      const rel = rels.get(String(rId))
      if (!rel) continue
      slidePaths.push(resolveTarget('ppt/presentation.xml', rel.target))
    }
    const result = { size, slidePaths }
    this.presentationCache = result
    return result
  }

  /** Resolve a slide's layout / master part paths (via the rels chain). */
  resolveSlideChain(slidePath: string): {
    layoutPath?: string
    masterPath?: string
    themePath?: string
  } {
    const slideRels = this.readRels(slidePath)
    let layoutPath: string | undefined
    for (const rel of slideRels.values()) {
      if (rel.type.endsWith('/slideLayout')) {
        layoutPath = resolveTarget(slidePath, rel.target)
        break
      }
    }
    // Damaged decks ship slides without a rels part (or without the mandatory slideLayout
    // relationship). PowerPoint refuses such files; LibreOffice renders them on the first
    // layout of the first master, which keeps the deck's background/decorations — do the same.
    if (!layoutPath) layoutPath = this.fallbackLayoutPath(slidePath)
    let masterPath: string | undefined
    let themePath: string | undefined
    if (layoutPath) {
      const layoutRels = this.readRels(layoutPath)
      for (const rel of layoutRels.values()) {
        if (rel.type.endsWith('/slideMaster')) {
          masterPath = resolveTarget(layoutPath, rel.target)
          break
        }
      }
    }
    if (masterPath) {
      const masterRels = this.readRels(masterPath)
      for (const rel of masterRels.values()) {
        if (rel.type.endsWith('/theme')) {
          themePath = resolveTarget(masterPath, rel.target)
          break
        }
      }
    }
    return { layoutPath, masterPath, themePath }
  }

  /**
   * Layout for a slide that lost its slideLayout relationship: the first master's layouts in
   * sldLayoutIdLst order, preferring the title layout for a slide carrying a ctrTitle placeholder
   * (what the deck's own title page would have referenced), else the first layout.
   */
  private fallbackLayoutPath(slidePath: string): string | undefined {
    const presXml = this.readText('ppt/presentation.xml')
    if (!presXml) return undefined
    const presRels = this.readRels('ppt/presentation.xml')
    const masterRid = /<p:sldMasterId\b[^>]*\br:id="([^"]+)"/.exec(presXml)?.[1]
    const masterRel = masterRid
      ? presRels.get(masterRid)
      : [...presRels.values()].find((r) => r.type.endsWith('/slideMaster'))
    if (!masterRel) return undefined
    const masterPath = resolveTarget('ppt/presentation.xml', masterRel.target)
    const masterXml = this.readText(masterPath)
    if (!masterXml) return undefined
    const masterRels = this.readRels(masterPath)
    const layouts: string[] = []
    for (const m of masterXml.matchAll(/<p:sldLayoutId\b[^>]*\br:id="([^"]+)"/g)) {
      const rel = masterRels.get(m[1]!)
      if (rel) layouts.push(resolveTarget(masterPath, rel.target))
    }
    if (!layouts.length)
      for (const rel of masterRels.values())
        if (rel.type.endsWith('/slideLayout')) layouts.push(resolveTarget(masterPath, rel.target))
    if (!layouts.length) return undefined
    const wantsTitle = /<p:ph\b[^>]*\btype="ctrTitle"/.test(this.readText(slidePath) ?? '')
    if (wantsTitle) {
      const title = layouts.find((p) =>
        /<p:sldLayout\b[^>]*\btype="title"/.test(this.readText(p) ?? ''),
      )
      if (title) return title
    }
    return layouts[0]
  }
}

/** 'ppt/slides/slide1.xml' → 'ppt/slides/_rels/slide1.xml.rels' */
export function relsPathFor(partPath: string): string {
  const idx = partPath.lastIndexOf('/')
  const dir = idx >= 0 ? partPath.slice(0, idx) : ''
  const file = idx >= 0 ? partPath.slice(idx + 1) : partPath
  return `${dir ? dir + '/' : ''}_rels/${file}.rels`
}

/**
 * Resolve a relative target into an absolute path inside the zip.
 * basePart is the referencing part's path (its directory is the base); target may be
 * something like '../slideLayouts/slideLayout1.xml'.
 */
export function resolveTarget(basePart: string, target: string): string {
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)) return ''
  let decoded: string
  try {
    decoded = decodeURIComponent(target)
  } catch {
    return ''
  }
  const baseSlash = basePart.lastIndexOf('/')
  const parts = decoded.startsWith('/')
    ? []
    : (baseSlash >= 0 ? basePart.slice(0, baseSlash) : '').split('/').filter(Boolean)
  for (const seg of decoded.replace(/\\/g, '/').split('/')) {
    if (seg === '.' || seg === '') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}
