import type { WebContentsPrintOptions } from 'electron'
import type { WorkbookExportPdfRequest } from '../shared/desktop-api'

const MICRONS_PER_INCH = 25_400
const CSS_PX_PER_INCH = 96

/// webContents.print options matching what printToPDF gets for the same
/// request: print() wants custom sizes in microns, margins in CSS pixels and
/// the scale as a percentage.
export function printOptionsFor(
  request: WorkbookExportPdfRequest,
  simple = false,
): WebContentsPrintOptions {
  let opts: WebContentsPrintOptions
  if (simple) {
    opts = {
      silent: false,
      printBackground: true,
      landscape: request.landscape,
      margins: { marginType: 'printableArea' },
    }
  } else {
    const { margins, pageSize } = request
    opts = {
      silent: false,
      printBackground: true,
      landscape: request.landscape,
      pageSize:
        typeof pageSize === 'string'
          ? pageSize
          : {
              width: Math.round(pageSize.width * MICRONS_PER_INCH),
              height: Math.round(pageSize.height * MICRONS_PER_INCH),
            },
      margins: {
        marginType: 'custom',
        top: Math.round(margins.top * CSS_PX_PER_INCH),
        bottom: Math.round(margins.bottom * CSS_PX_PER_INCH),
        left: Math.round(margins.left * CSS_PX_PER_INCH),
        right: Math.round(margins.right * CSS_PX_PER_INCH),
      },
      scaleFactor: Math.max(10, Math.min(400, Math.round(request.scale * 100))),
    }
  }

  if (request.copies && request.copies > 1) {
    opts.copies = request.copies
  }
  if (request.duplexMode) {
    opts.duplexMode = request.duplexMode
  }
  if (typeof request.collate === 'boolean') {
    opts.collate = request.collate
  }

  return opts
}
