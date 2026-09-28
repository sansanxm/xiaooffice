import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import JSZip from 'jszip'
import {
  isLegacyDocument,
  isPagesDocument,
  isLegacyPresentation,
  isKeynotePresentation,
  extractPreviewPdf,
  convertLegacyDocumentToDocx,
} from '../src/main/legacy-formats'

describe('legacy formats detection', () => {
  it('correctly identifies legacy and third-party document types', () => {
    expect(isLegacyDocument('/path/to/report.doc')).toBe(true)
    expect(isLegacyDocument('/path/to/template.dot')).toBe(true)
    expect(isLegacyDocument('/path/to/document.odt')).toBe(true)
    expect(isLegacyDocument('/path/to/rich.rtf')).toBe(true)
    expect(isLegacyDocument('/path/to/normal.docx')).toBe(false)
    expect(isLegacyDocument('/path/to/sheet.xlsx')).toBe(false)

    expect(isPagesDocument('/path/to/report.pages')).toBe(true)
    expect(isPagesDocument('/path/to/report.docx')).toBe(false)

    expect(isLegacyPresentation('/path/to/deck.ppt')).toBe(true)
    expect(isLegacyPresentation('/path/to/deck.pot')).toBe(true)
    expect(isLegacyPresentation('/path/to/deck.pps')).toBe(true)
    expect(isLegacyPresentation('/path/to/deck.odp')).toBe(true)
    expect(isLegacyPresentation('/path/to/deck.pptx')).toBe(false)

    expect(isKeynotePresentation('/path/to/presentation.key')).toBe(true)
    expect(isKeynotePresentation('/path/to/presentation.pptx')).toBe(false)
  })

  it('extracts preview PDF from a zip-based iWork package', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pages-test-'))
    try {
      const zip = new JSZip()
      zip.file('QuickLook/Preview.pdf', '%PDF-1.4\n%fake-pdf-header\n')
      const zipBytes = await zip.generateAsync({ type: 'nodebuffer' })
      const pagesPath = join(dir, 'test.pages')
      await writeFile(pagesPath, zipBytes)

      const extracted = await extractPreviewPdf(pagesPath, dir)
      expect(extracted).not.toBeNull()
      expect(extracted?.endsWith('preview.pdf')).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  if (process.platform === 'darwin') {
    it('converts an RTF document to DOCX using textutil on macOS', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'rtf-test-'))
      try {
        const rtfPath = join(dir, 'sample.rtf')
        const rtfContent = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 Hello World!}'
        await writeFile(rtfPath, rtfContent, 'utf-8')

        const docxPath = await convertLegacyDocumentToDocx(rtfPath)
        expect(docxPath).toBeTruthy()
        expect(docxPath.endsWith('.docx')).toBe(true)
      } finally {
        await rm(dir, { recursive: true, force: true })
      }
    })
  }
})
