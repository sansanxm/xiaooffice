/**
 * Page Layout View ("Bố cục trang" / "Vừa trang in"):
 * Displays the sheet formatted into discrete pages matching the current
 * paper size (A4, A3, A5, Letter...), orientation, margins, and scaling.
 * Renders page frames, margin guides, paper badges, and automatically fits
 * the page width to the viewport on demand.
 */
import type { PageSetupJournalState } from './edit-journal'
import { t } from './i18n/locale'
import {
  computePageBoundaries,
  printablePagePt,
} from './page-break-preview'
import type { UniverRuntime, UniverWorksheet } from './univer-state'

interface Disposable {
  dispose(): void
}

export const PAPER_INFO: Record<
  number,
  { name: string; widthMm: number; heightMm: number; widthIn: number; heightIn: number }
> = {
  1: { name: 'Letter', widthMm: 216, heightMm: 279, widthIn: 8.5, heightIn: 11 },
  3: { name: 'Tabloid', widthMm: 279, heightMm: 432, widthIn: 11, heightIn: 17 },
  5: { name: 'Legal', widthMm: 216, heightMm: 356, widthIn: 8.5, heightIn: 14 },
  7: { name: 'Executive', widthMm: 184, heightMm: 267, widthIn: 7.25, heightIn: 10.5 },
  8: { name: 'A3', widthMm: 297, heightMm: 420, widthIn: 11.69, heightIn: 16.54 },
  9: { name: 'A4', widthMm: 210, heightMm: 297, widthIn: 8.27, heightIn: 11.69 },
  11: { name: 'A5', widthMm: 148, heightMm: 210, widthIn: 5.83, heightIn: 8.27 },
}

const MARGIN_LABELS = {
  normal: 'Thường (Normal)',
  wide: 'Rộng (Wide)',
  narrow: 'Hẹp (Narrow)',
} as const

const MAX_PAGE_COUNT = 50
const MAX_EXTENT_ROWS = 10_000
const MAX_EXTENT_COLUMNS = 1_000

export function getPaperDescription(paperSize: number | undefined): string {
  const info = PAPER_INFO[paperSize ?? 9] ?? PAPER_INFO[9]!
  return `${info.name} (${info.widthMm} × ${info.heightMm} mm)`
}

export function installPageLayoutView(
  runtime: UniverRuntime,
  worksheet: UniverWorksheet,
  pageSetup: PageSetupJournalState,
  breaks: { rowBreaks: readonly number[]; colBreaks: readonly number[] },
  extent: { rows: number; columns: number },
  idPrefix: string,
): Disposable[] {
  const rows = Math.min(Math.max(worksheet.getLastRow() + 1, extent.rows, 1), MAX_EXTENT_ROWS)
  const columns = Math.min(
    Math.max(worksheet.getLastColumn() + 1, extent.columns, 1),
    MAX_EXTENT_COLUMNS,
  )
  const page = printablePagePt(pageSetup)
  let contentWidthPt = 0
  for (let column = 0; column < columns; column += 1) {
    contentWidthPt += worksheet.getColumnWidth(column) * 0.75
  }

  const fitPages = pageSetup.fitToPage === true ? (pageSetup.fitToWidth ?? 0) : 0
  let scale = 1
  if (fitPages > 0 && contentWidthPt > 0) {
    scale = Math.min(Math.max((page.width * fitPages) / contentWidthPt, 0.1), 1)
  } else if (pageSetup.fitToPage !== true && pageSetup.scale !== undefined) {
    scale = Math.min(Math.max(pageSetup.scale / 100, 0.1), 2)
  }

  const rowBoundaries = computePageBoundaries(
    (index) => worksheet.getRowHeight(index),
    rows,
    page.height,
    scale,
    breaks.rowBreaks,
  ).slice(0, 100)

  const colBoundaries = computePageBoundaries(
    (index) => worksheet.getColumnWidth(index),
    columns,
    page.width,
    scale,
    breaks.colBreaks,
  ).slice(0, 100)

  const disposables: Disposable[] = []
  const layer = (
    key: string,
    startRow: number,
    startColumn: number,
    rowCount: number,
    columnCount: number,
    render: () => React.JSX.Element,
  ): void => {
    disposables.push(runtime.univerAPI.registerComponent(key, render))
    const floating = worksheet.addFloatDomToRange(
      worksheet.getRange(startRow, startColumn, rowCount, columnCount),
      { componentKey: key, allowTransform: false, eventPassThrough: true },
      {},
      key,
    )
    if (floating) disposables.push(floating)
  }

  const paperInfo = PAPER_INFO[pageSetup.paperSize ?? 9] ?? PAPER_INFO[9]!
  const isLandscape = pageSetup.orientation === 'landscape'
  const orientationName = isLandscape ? 'Ngang (Landscape)' : 'Dọc (Portrait)'
  const marginLabel = MARGIN_LABELS[pageSetup.margins ?? 'normal'] ?? MARGIN_LABELS.normal
  const scalePercent = Math.round(scale * 100)

  const rowEdges = [0, ...rowBoundaries.map((b) => b.index), rows]
  const colEdges = [0, ...colBoundaries.map((b) => b.index), columns]

  let pageIndex = 0
  for (let colPage = 0; colPage < colEdges.length - 1 && pageIndex < MAX_PAGE_COUNT; colPage += 1) {
    for (let rowPage = 0; rowPage < rowEdges.length - 1 && pageIndex < MAX_PAGE_COUNT; rowPage += 1) {
      pageIndex += 1
      const pNum = pageIndex
      const startR = rowEdges[rowPage] ?? 0
      const endR = rowEdges[rowPage + 1] ?? rows
      const startC = colEdges[colPage] ?? 0
      const endC = colEdges[colPage + 1] ?? columns
      const numRows = Math.max(1, endR - startR)
      const numCols = Math.max(1, endC - startC)

      layer(
        `${idPrefix}-card-${pNum}`,
        startR,
        startC,
        numRows,
        numCols,
        () => (
          <div className="page-layout-card">
            <div className="page-layout-header-badge">
              <span>📄 {t('appPageWatermark', { page: pNum })}</span>
              <span>•</span>
              <span>
                {paperInfo.name} ({paperInfo.widthMm} × {paperInfo.heightMm} mm)
              </span>
              <span>•</span>
              <span>{orientationName}</span>
            </div>
            <div className="page-layout-footer-badge">
              <span>Lề: {marginLabel}</span>
              <span>•</span>
              <span>Tỷ lệ in: {scalePercent}%</span>
            </div>
          </div>
        ),
      )
    }
  }

  return disposables
}
