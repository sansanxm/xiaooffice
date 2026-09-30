/**
 * Pure calculation logic for Morph transitions:
 * - Multi-tier matching cascade (PowerPoint "!!" forced morph, spid, name, media, placeholder, text, geometry, type)
 * - Angle interpolation with shortest arc normalization
 * - Cubic ease-in-out curve
 */
import type { PictureRenderNode, RenderNode, RenderSlide, ShapeRenderNode } from '@genoffice/pptx-render'
import type { ShapeKey } from '../../shared/ipc'

/** Tween duration (ms); 750ms provides a cinematic, fluid PowerPoint-grade glide. */
export const MORPH_MS = 750

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function normalizeAngle(deg: number): number {
  let a = deg % 360
  if (a > 180) a -= 360
  if (a < -180) a += 360
  return a
}

export function lerpAngle(fromDeg: number, toDeg: number, t: number): number {
  const diff = normalizeAngle(toDeg - fromDeg)
  return fromDeg + diff * t
}

export function extractNodeText(node: RenderNode): string {
  if (node.type === 'shape' || node.type === 'text') {
    const sn = node as ShapeRenderNode
    if (sn.text && sn.text.lines) {
      return sn.text.lines
        .map((l) => l.runs.map((r) => r.text).join(''))
        .join(' ')
        .trim()
    }
  }
  return ''
}

export function extractNodeMedia(node: RenderNode): string | undefined {
  if (node.type === 'picture') {
    return (node as PictureRenderNode).dataUrl
  }
  if ((node as any).fill?.kind === 'image') {
    return (node as any).fill.dataUrl
  }
  return undefined
}

export interface NodeDescriptor {
  node: RenderNode
  key?: ShapeKey
  bangBangName?: string
  name?: string
  spid?: number
  text?: string
  media?: string
  placeholder?: string
  presetGeometry?: string
  type: string
}

export function buildDescriptor(node: RenderNode, keyMap: Map<string, ShapeKey>): NodeDescriptor {
  const k = keyMap.get(node.sourceId) ?? keyMap.get(node.id)
  let rawName = k?.name ?? (node as any).name ?? ''
  let bangBangName: string | undefined
  let name: string | undefined
  if (rawName) {
    const trimmed = String(rawName).trim()
    if (trimmed.startsWith('!!')) {
      bangBangName = trimmed.slice(2).trim().toLowerCase()
    }
    name = trimmed.toLowerCase()
  }

  const rawSpid = k?.spid ?? (node as any).spid ?? ((node as any).nvId ? Number((node as any).nvId) : undefined)
  const text = extractNodeText(node)
  const media = extractNodeMedia(node)
  const placeholder = (node as any).placeholder ? String((node as any).placeholder).toLowerCase() : undefined
  const presetGeometry = (node as any).presetGeometry ? String((node as any).presetGeometry).toLowerCase() : undefined

  return {
    node,
    key: k,
    bangBangName,
    name,
    spid: Number.isFinite(rawSpid) ? rawSpid : undefined,
    text: text.length > 0 ? text : undefined,
    media,
    placeholder,
    presetGeometry,
    type: node.type,
  }
}

/** Tween source for each content node on the target page (no from = new, fades in). */
export interface MorphPlan {
  /** Target node sourceId → paired node on the previous page */
  fromOf: Map<string, RenderNode>
  /** Nodes unique to the previous page (fade out) */
  leaving: RenderNode[]
}

export function buildPlan(
  from: RenderSlide,
  to: RenderSlide,
  fromKeys?: ShapeKey[],
  toKeys?: ShapeKey[],
): MorphPlan {
  const fkMap = new Map((fromKeys ?? []).map((k) => [k.sourceId, k]))
  const tkMap = new Map((toKeys ?? []).map((k) => [k.sourceId, k]))

  const fromItems: NodeDescriptor[] = []
  for (const n of from.nodes) {
    if (n.decoration) continue
    fromItems.push(buildDescriptor(n, fkMap))
  }

  const toItems: NodeDescriptor[] = []
  for (const n of to.nodes) {
    if (n.decoration) continue
    toItems.push(buildDescriptor(n, tkMap))
  }

  const usedFrom = new Set<NodeDescriptor>()
  const fromOf = new Map<string, RenderNode>()

  const pairWith = (toItem: NodeDescriptor, predicate: (fromItem: NodeDescriptor) => boolean): boolean => {
    for (const fromItem of fromItems) {
      if (usedFrom.has(fromItem)) continue
      if (predicate(fromItem)) {
        usedFrom.add(fromItem)
        fromOf.set(toItem.node.sourceId, fromItem.node)
        return true
      }
    }
    return false
  }

  // Tier 1: Bang-bang names (PowerPoint standard !!name override)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.bangBangName) {
      pairWith(t, (f) => !!f.bangBangName && f.bangBangName === t.bangBangName)
    }
  }

  // Tier 2: Exact durable spid (cNvPr id / duplicated slide id)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.spid != null) {
      pairWith(t, (f) => f.spid != null && f.spid === t.spid)
    }
  }

  // Tier 3: Same shape name
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.name) {
      pairWith(t, (f) => !!f.name && f.name === t.name)
    }
  }

  // Tier 4: Same image / media dataUrl
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.media) {
      pairWith(t, (f) => !!f.media && f.media === t.media)
    }
  }

  // Tier 5: Same placeholder type (e.g. title -> title, body -> body)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.placeholder) {
      pairWith(t, (f) => !!f.placeholder && f.placeholder === t.placeholder)
    }
  }

  // Tier 6: Identical non-empty text content (at least 2 characters)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.text && t.text.length >= 2) {
      pairWith(t, (f) => !!f.text && f.text === t.text)
    }
  }

  // Tier 7: Same preset geometry (e.g. rect -> rect, ellipse -> ellipse)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    if (t.presetGeometry) {
      pairWith(t, (f) => !!f.presetGeometry && f.presetGeometry === t.presetGeometry)
    }
  }

  // Tier 8: Positional order fallback for same type (shape to shape, text to text, picture to picture)
  for (const t of toItems) {
    if (fromOf.has(t.node.sourceId)) continue
    pairWith(t, (f) => f.type === t.type)
  }

  const leaving = fromItems
    .filter((f) => !usedFrom.has(f))
    .map((f) => f.node)

  return { fromOf, leaving }
}
