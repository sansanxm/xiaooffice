/**
 * Print dialog modeled on Word's print sheet (same pattern as the slides app):
 * live page preview on the left (a scaled clone of the pagination-preview page
 * that will actually print), range options on the right. "Print" hides the
 * unselected .pv-page sheets via pv-print-skip and hands the preview pages to
 * the system print dialog.
 *
 * The pagination preview must be mounted (the App opens it, visually hidden,
 * when the dialog opens): its .pv-page boxes are both the print source and the
 * preview source, so what the dialog shows is exactly what prints.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/locale'
import { parsePrintRange } from '../print-range'
import { clearPrintZoom, setPrintZoom } from '../print-zoom'

type RangeMode = 'all' | 'current' | 'custom'
type PageSubset = 'all' | 'odd' | 'even'
type DuplexMode = 'simplex' | 'longEdge' | 'shortEdge'

const pvPages = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('.pagination-preview .pv-page'),
]

export function PrintDialog({
  onClose,
  setStatus,
}: {
  onClose: () => void
  setStatus: (s: string) => void
}) {
  const { t } = useI18n()
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rangeMode, setRangeMode] = useState<RangeMode>('all')
  const [customRange, setCustomRange] = useState('')
  const [subset, setSubset] = useState<PageSubset>('all')
  const [duplex, setDuplex] = useState<DuplexMode>('simplex')
  const [copies, setCopies] = useState(1)
  const [collate, setCollate] = useState(true)
  const [printing, setPrinting] = useState(false)
  const paneRef = useRef<HTMLDivElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

  // The pagination preview measures and slices asynchronously; poll until the
  // .pv-page count is stable (and keep tracking it, e.g. re-slices on resize).
  useEffect(() => {
    let last = -1
    const timer = window.setInterval(() => {
      const n = pvPages().length
      if (n > 0 && n === last) setPageCount(n)
      last = n
    }, 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const current = Math.min(page, Math.max(0, pageCount - 1))
  const ready = pageCount > 0

  /** 0-based page indices selected by the range options (null = invalid custom range) */
  const rawSelected: number[] | null =
    rangeMode === 'all'
      ? Array.from({ length: pageCount }, (_x, i) => i)
      : rangeMode === 'current'
        ? [current]
        : parsePrintRange(customRange, pageCount)

  const selected: number[] | null =
    rawSelected === null
      ? null
      : rawSelected.filter((idx) => {
          if (subset === 'odd') return (idx + 1) % 2 !== 0
          if (subset === 'even') return (idx + 1) % 2 === 0
          return true
        })

  const rangeInvalid = rangeMode === 'custom' && rawSelected === null

  /** Scale the cloned page so the whole sheet fits the preview pane (Word-style single-page fit) */
  const applyZoom = useCallback(() => {
    const pane = paneRef.current
    const host = hostRef.current
    const pageEl = host?.firstElementChild as HTMLElement | null
    if (!pane || !host || !pageEl) return
    host.style.zoom = '1'
    const w = pageEl.offsetWidth
    const h = pageEl.offsetHeight
    if (w > 0 && h > 0) {
      host.style.zoom = String(Math.min((pane.clientWidth - 36) / w, (pane.clientHeight - 36) / h))
    }
  }, [])

  // Show one printed sheet at a time: clone the selected .pv-page (styles apply
  // in-document, so the clone renders identically) and fit it to the pane.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.replaceChildren()
    const src = pvPages()[current]
    if (!src) return
    const clone = src.cloneNode(true) as HTMLElement
    clone.classList.remove('pv-print-skip')
    clone.querySelector('.pv-pageno')?.remove()
    host.appendChild(clone)
    applyZoom()
  }, [pageCount, current, applyZoom])

  // `ready` in the deps: the pane only mounts once pages exist, so the observer
  // must (re)attach after the first pageCount update, not just on dialog mount
  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    const ro = new ResizeObserver(applyZoom)
    ro.observe(pane)
    return () => ro.disconnect()
  }, [applyZoom, ready])

  const doPrint = async () => {
    const els = pvPages()
    if (!selected || selected.length === 0 || printing) return
    const sel = new Set(selected)
    setPrinting(true)
    // pv-print-skip only takes effect in the print stylesheet: the on-screen
    // (hidden) preview keeps its layout while unselected sheets don't print.
    els.forEach((el, i) => el.classList.toggle('pv-print-skip', !sel.has(i)))
    const scale = setPrintZoom()
    try {
      const r = await window.desktop.print(scale, {
        copies: copies > 1 ? copies : undefined,
        duplexMode: duplex,
        collate: copies > 1 ? collate : undefined,
      })
      if (r.ok) {
        onClose()
        return
      }
      if (r.error) setStatus(t('appPrintFailed', { error: r.error }))
      // not ok without an error = canceled in the system dialog: keep the dialog open
    } finally {
      clearPrintZoom()
      els.forEach((el) => el.classList.remove('pv-print-skip'))
      setPrinting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal print-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{t('appPrintTitle')}</h2>
        <div className="print-dialog-body">
          <div className="print-preview-pane">
            {ready ? (
              <>
                <div className="print-preview-page" ref={paneRef}>
                  <div className="print-preview-zoom" ref={hostRef} />
                </div>
                <div className="print-preview-nav">
                  <button
                    aria-label={t('appPrintPrevPage')}
                    title={t('appPrintPrevPage')}
                    disabled={current <= 0}
                    onClick={() => setPage(current - 1)}
                  >
                    ‹
                  </button>
                  <span>
                    {current + 1} / {pageCount}
                  </span>
                  <button
                    aria-label={t('appPrintNextPage')}
                    title={t('appPrintNextPage')}
                    disabled={current >= pageCount - 1}
                    onClick={() => setPage(current + 1)}
                  >
                    ›
                  </button>
                </div>
              </>
            ) : (
              <div className="print-preview-empty">{t('appPrintRendering')}</div>
            )}
          </div>
          <div className="print-options">
            <fieldset>
              <legend>{t('appPrintCopies')}</legend>
              <div className="print-copies-row">
                <input
                  type="number"
                  min={1}
                  max={999}
                  className="print-copies-input"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
                />
                {copies > 1 && (
                  <label className="print-checkbox">
                    <input
                      type="checkbox"
                      checked={collate}
                      onChange={(e) => setCollate(e.target.checked)}
                    />
                    {t('appPrintCollate')}
                  </label>
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend>{t('appPrintRange')}</legend>
              <label className="print-radio">
                <input
                  type="radio"
                  name="print-range"
                  checked={rangeMode === 'all'}
                  onChange={() => setRangeMode('all')}
                />
                {t('appPrintRangeAll')}
              </label>
              <label className="print-radio">
                <input
                  type="radio"
                  name="print-range"
                  checked={rangeMode === 'current'}
                  onChange={() => setRangeMode('current')}
                />
                {t('appPrintRangeCurrent')}
              </label>
              <label className="print-radio">
                <input
                  type="radio"
                  name="print-range"
                  checked={rangeMode === 'custom'}
                  onChange={() => setRangeMode('custom')}
                />
                {t('appPrintRangeCustom')}
              </label>
              <input
                type="text"
                className={`print-range-input ${rangeInvalid ? 'invalid' : ''}`}
                placeholder={t('appPrintRangeHint')}
                value={customRange}
                disabled={rangeMode !== 'custom'}
                onFocus={() => setRangeMode('custom')}
                onChange={(e) => setCustomRange(e.target.value)}
              />
            </fieldset>

            <fieldset>
              <legend>{t('appPrintSubset')}</legend>
              <select
                className="print-select"
                value={subset}
                onChange={(e) => setSubset(e.target.value as PageSubset)}
              >
                <option value="all">{t('appPrintSubsetAll')}</option>
                <option value="odd">{t('appPrintSubsetOdd')}</option>
                <option value="even">{t('appPrintSubsetEven')}</option>
              </select>
            </fieldset>

            <fieldset>
              <legend>{t('appPrintSides')}</legend>
              <select
                className="print-select"
                value={duplex}
                onChange={(e) => setDuplex(e.target.value as DuplexMode)}
              >
                <option value="simplex">{t('appPrintSidesOneSided')}</option>
                <option value="longEdge">{t('appPrintSidesDuplexLong')}</option>
                <option value="shortEdge">{t('appPrintSidesDuplexShort')}</option>
              </select>
            </fieldset>

            <div className="print-page-count">
              {ready && selected && selected.length > 0
                ? t('appPrintSummary', { n: selected.length, copies })
                : ready && (!selected || selected.length === 0)
                  ? t('appPrintNoPages')
                  : ''}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>{t('appCancel')}</button>
          <button
            className="primary"
            disabled={!ready || !selected || selected.length === 0 || printing}
            onClick={() => void doPrint()}
          >
            {printing ? t('appPrintProgress') : t('appPrintButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
