import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { app } from 'electron'
import JSZip from 'jszip'

function getTempDir(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('temp')
    }
  } catch {}
  return tmpdir()
}

export const DOC_LEGACY_RE = /\.(doc|dot|odt|rtf)$/i
export const PAGES_RE = /\.pages$/i
export const PPT_LEGACY_RE = /\.(ppt|pot|pps|odp)$/i
export const KEYNOTE_RE = /\.key$/i
export const NUMBERS_RE = /\.numbers$/i

export function isLegacyDocument(path: string): boolean {
  return DOC_LEGACY_RE.test(path)
}

export function isPagesDocument(path: string): boolean {
  return PAGES_RE.test(path)
}

export function isLegacyPresentation(path: string): boolean {
  return PPT_LEGACY_RE.test(path)
}

export function isKeynotePresentation(path: string): boolean {
  return KEYNOTE_RE.test(path)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Extract QuickLook/Preview.pdf from Apple packages (Pages, Keynote, Numbers).
 * Apple saves a high-fidelity vector PDF preview inside the package.
 */
export async function extractPreviewPdf(pkgPath: string, outDir: string): Promise<string | null> {
  const targetPdf = join(outDir, 'preview.pdf')
  try {
    const st = statSync(pkgPath)
    if (st.isDirectory()) {
      const candidates = [
        join(pkgPath, 'QuickLook', 'Preview.pdf'),
        join(pkgPath, 'QuickLook', 'preview.pdf'),
        join(pkgPath, 'preview.pdf'),
        join(pkgPath, 'Preview.pdf'),
      ]
      for (const cand of candidates) {
        if (existsSync(cand)) {
          await copyFile(cand, targetPdf)
          return targetPdf
        }
      }
    } else {
      // Zip file: try unzip utility first (instant on macOS), then JSZip
      if (process.platform === 'darwin') {
        try {
          execFileSync('/usr/bin/unzip', ['-p', pkgPath, 'QuickLook/Preview.pdf'], {
            maxBuffer: 50 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'ignore'],
          })
          const pdfBuffer = execFileSync('/usr/bin/unzip', ['-p', pkgPath, 'QuickLook/Preview.pdf'], {
            maxBuffer: 50 * 1024 * 1024,
          })
          if (pdfBuffer.length > 0) {
            await writeFile(targetPdf, pdfBuffer)
            return targetPdf
          }
        } catch {
          // fallback to JSZip search
        }
      }

      const buf = await readFile(pkgPath)
      const zip = await JSZip.loadAsync(buf)
      const entry = Object.keys(zip.files).find((k) => /(^|\/)preview\.pdf$/i.test(k))
      if (entry) {
        const pdfBytes = await zip.files[entry].async('nodebuffer')
        await writeFile(targetPdf, pdfBytes)
        return targetPdf
      }
    }
  } catch (err) {
    console.warn('[legacy-formats] extractPreviewPdf error:', err)
  }
  return null
}

/**
 * Converts .doc, .dot, .odt, .rtf to .docx so it can be edited directly in Docs.
 */
export async function convertLegacyDocumentToDocx(filePath: string): Promise<string> {
  const tempDir = join(getTempDir(), 'genoffice-conversions', randomUUID())
  await mkdir(tempDir, { recursive: true })
  const baseName = basename(filePath, extname(filePath))
  const targetPath = join(tempDir, `${baseName}.docx`)

  // 1. macOS native textutil (ultra-fast, preserves formatting, tables, fonts)
  if (process.platform === 'darwin') {
    try {
      execFileSync('/usr/bin/textutil', ['-convert', 'docx', '-output', targetPath, filePath], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      if (existsSync(targetPath)) return targetPath
    } catch (err) {
      console.warn('[legacy-formats] macOS textutil conversion failed:', err)
    }
  }

  // 2. LibreOffice soffice headless conversion if installed
  try {
    const sofficeBin = process.platform === 'win32' ? 'soffice.exe' : 'soffice'
    execFileSync(sofficeBin, ['--headless', '--convert-to', 'docx', '--outdir', tempDir, filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    })
    if (existsSync(targetPath)) return targetPath
  } catch {
    // soffice not found or failed
  }

  // 3. Fallback for .doc using word-extractor + buildBlankDocx
  const ext = extname(filePath).slice(1).toLowerCase()
  if (ext === 'doc') {
    try {
      const { docToText } = await import('../../../../packages/file-parse/src/doc')
      const { buildBlankDocx } = await import('../../../../packages/docx-engine/src/blank')
      const text = await docToText(await readFile(filePath))
      const docxBytes = await buildBlankDocx()
      const zip = await JSZip.loadAsync(docxBytes)
      const bodyXml = text
        .split('\n')
        .map((line) => `<w:p><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`)
        .join('')
      const docXml = zip.file('word/document.xml')
      if (docXml) {
        const current = await docXml.async('text')
        const updated = current.replace('<w:p/>', bodyXml || '<w:p/>')
        zip.file('word/document.xml', updated)
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer' })
      await writeFile(targetPath, buffer)
      return targetPath
    } catch (err) {
      console.warn('[legacy-formats] fallback doc conversion failed:', err)
    }
  }

  throw new Error(`Could not convert legacy document: ${basename(filePath)}`)
}

/**
 * Converts Apple Pages (.pages) to .docx using the embedded high-fidelity preview PDF.
 */
export async function convertPagesDocumentToDocx(filePath: string): Promise<string> {
  const tempDir = join(getTempDir(), 'genoffice-conversions', randomUUID())
  await mkdir(tempDir, { recursive: true })
  const baseName = basename(filePath, extname(filePath))
  const targetDocx = join(tempDir, `${baseName}.docx`)

  const previewPdfPath = await extractPreviewPdf(filePath, tempDir)
  if (previewPdfPath && existsSync(previewPdfPath)) {
    const { convertPdfFileToDocxLocal } = await import('./pdf2docx-local')
    const result = await convertPdfFileToDocxLocal(previewPdfPath)
    if (result?.docx) {
      await writeFile(targetDocx, result.docx)
      return targetDocx
    }
  }

  // Fallback: If on macOS and Pages is available, try AppleScript export
  if (process.platform === 'darwin') {
    try {
      const script = `
        set docPath to POSIX file "${filePath.replace(/"/g, '\\"')}"
        set outPath to POSIX file "${targetDocx.replace(/"/g, '\\"')}"
        tell application "Pages"
          set myDoc to open file docPath
          export myDoc to outPath as Microsoft Word
          close myDoc saving no
        end tell
      `
      execFileSync('osascript', ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] })
      if (existsSync(targetDocx)) return targetDocx
    } catch {
      // Pages not installed
    }
  }

  throw new Error(`Could not read Apple Pages document: ${basename(filePath)}`)
}

/**
 * Converts legacy PowerPoint (.ppt, .pot, .pps, .odp) to .pptx.
 */
export async function convertLegacyPresentationToPptx(filePath: string): Promise<string> {
  const tempDir = join(getTempDir(), 'genoffice-conversions', randomUUID())
  await mkdir(tempDir, { recursive: true })
  const baseName = basename(filePath, extname(filePath))
  const targetPath = join(tempDir, `${baseName}.pptx`)

  // 1. Try soffice if available
  try {
    const sofficeBin = process.platform === 'win32' ? 'soffice.exe' : 'soffice'
    execFileSync(sofficeBin, ['--headless', '--convert-to', 'pptx', '--outdir', tempDir, filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    })
    if (existsSync(targetPath)) return targetPath
  } catch {}

  // 2. Fallback using ppt-to-text and pptx template
  try {
    const { pptToText } = await import('../../../../packages/file-parse/src/ppt')
    const text = await pptToText(await readFile(filePath))
    const { openPptx, savePptx, insertBlankSlide } = await import(
      '../../../../packages/pptx-engine/src'
    )
    const { addElement } = await import('../../../../packages/pptx-engine/src/insert')
    const { createBlankPptx } = await import('../../../../packages/pptx-engine/src/blank')
    const blankBuf = await createBlankPptx()
    const opened = await openPptx(blankBuf)
    const slidesText = text.split(/## Slide \d+/).map((s) => s.trim()).filter(Boolean)
    if (slidesText.length > 0) {
      for (let i = 0; i < slidesText.length; i++) {
        const slide = i === 0 ? opened.deck.slides[0] : insertBlankSlide(opened, i - 1)
        if (slide) {
          const lines = slidesText[i].split('\n').filter(Boolean)
          const title = lines[0] || `Slide ${i + 1}`
          const body = lines.slice(1).join('\n')
          addElement(slide, {
            kind: 'textbox',
            offset: { x: 914400, y: 714400, cx: 10363200, cy: 1000000 },
            paragraphs: [{ runs: [{ text: title, fontSize: 32, bold: true }] }],
          })
          if (body) {
            addElement(slide, {
              kind: 'textbox',
              offset: { x: 914400, y: 2000000, cx: 10363200, cy: 4000000 },
              paragraphs: body.split('\n').map((l) => ({
                runs: [{ text: l, fontSize: 18 }],
              })),
            })
          }
        }
      }
    }
    const saved = await savePptx(opened)
    await writeFile(targetPath, saved)
    return targetPath
  } catch (err) {
    console.warn('[legacy-formats] fallback PPT parse failed:', err)
  }

  throw new Error(`Could not convert legacy presentation: ${basename(filePath)}`)
}

/**
 * Converts Apple Keynote (.key) to .pptx using the embedded preview PDF.
 */
export async function convertKeynoteToPptx(filePath: string): Promise<string> {
  const tempDir = join(getTempDir(), 'genoffice-conversions', randomUUID())
  await mkdir(tempDir, { recursive: true })
  const baseName = basename(filePath, extname(filePath))
  const targetPptx = join(tempDir, `${baseName}.pptx`)

  const previewPdfPath = await extractPreviewPdf(filePath, tempDir)
  if (previewPdfPath && existsSync(previewPdfPath)) {
    const { convertPdfFileToPptxLocal } = await import('./pdf2pptx-local')
    const result = await convertPdfFileToPptxLocal(previewPdfPath)
    if (result?.pptx) {
      await writeFile(targetPptx, result.pptx)
      return targetPptx
    }
  }

  throw new Error(`Could not read Apple Keynote presentation: ${basename(filePath)}`)
}
