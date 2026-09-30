import { useEffect, useRef, useState, useTransition } from 'react'

import { useI18n } from '../i18n/locale'
import {
  activeSheetPrintPayload,
  getEffectivePageSetup,
  type PageLayoutContext,
} from '../page-layout-actions'
import { MARGIN_PRESETS, type EffectivePageSetup } from '../print-settings'
import type { WorkbookExportPdfRequest } from '../../shared/desktop-api'

export interface PrintPreviewDialogProps {
  readonly ctx: PageLayoutContext
  readonly onClose: () => void
}

type ScaleOption = 'actual' | 'fitPage' | 'fitCols' | 'fitRows' | 'custom'
type MarginOption = 'normal' | 'wide' | 'narrow'
type DuplexOption = 'simplex' | 'longEdge' | 'shortEdge'

const PAPER_OPTIONS: readonly { id: number; name: string; desc: string }[] = [
  { id: 9, name: 'A4', desc: '210 × 297 mm' },
  { id: 1, name: 'Letter', desc: '8.5 × 11 in' },
  { id: 5, name: 'Legal', desc: '8.5 × 14 in' },
  { id: 8, name: 'A3', desc: '297 × 420 mm' },
  { id: 11, name: 'A5', desc: '148 × 210 mm' },
]

export function PrintPreviewDialog({ ctx, onClose }: PrintPreviewDialogProps) {
  const { t } = useI18n()
  const initialSetup = useRef(getEffectivePageSetup(ctx))

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    initialSetup.current?.orientation ?? 'portrait',
  )
  const [paperSize, setPaperSize] = useState<number>(initialSetup.current?.paperSize ?? 9)
  const [scaleMode, setScaleMode] = useState<ScaleOption>(() => {
    if (initialSetup.current?.fitToPage) {
      if (initialSetup.current.fitToWidth === 1 && initialSetup.current.fitToHeight === 1) {
        return 'fitPage'
      }
      if (initialSetup.current.fitToWidth === 1 && initialSetup.current.fitToHeight === 0) {
        return 'fitCols'
      }
      if (initialSetup.current.fitToWidth === 0 && initialSetup.current.fitToHeight === 1) {
        return 'fitRows'
      }
    }
    return initialSetup.current?.scale && initialSetup.current.scale !== 100 ? 'custom' : 'actual'
  })
  const [customScale, setCustomScale] = useState<number>(initialSetup.current?.scale ?? 100)
  const [marginOption, setMarginOption] = useState<MarginOption>('normal')
  const [printGridlines, setPrintGridlines] = useState(
    initialSetup.current?.printGridlines ?? false,
  )
  const [printHeadings, setPrintHeadings] = useState(initialSetup.current?.printHeadings ?? false)

  const [copies, setCopies] = useState(1)
  const [collate, setCollate] = useState(true)
  const [duplex, setDuplex] = useState<DuplexOption>('simplex')

  const [zoom, setZoom] = useState<number>(1)
  const [payload, setPayload] = useState<WorkbookExportPdfRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [, startTransition] = useTransition()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Recalculate preview payload whenever page settings change
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      const margins = MARGIN_PRESETS[marginOption]
      let fitToPage = false
      let fitToWidth = 0
      let fitToHeight = 0
      let scale = 100

      if (scaleMode === 'fitPage') {
        fitToPage = true
        fitToWidth = 1
        fitToHeight = 1
      } else if (scaleMode === 'fitCols') {
        fitToPage = true
        fitToWidth = 1
        fitToHeight = 0
      } else if (scaleMode === 'fitRows') {
        fitToPage = true
        fitToWidth = 0
        fitToHeight = 1
      } else if (scaleMode === 'custom') {
        scale = Math.max(10, Math.min(400, customScale))
      }

      const override: Partial<EffectivePageSetup> = {
        orientation,
        paperSize,
        margins,
        fitToPage,
        fitToWidth,
        fitToHeight,
        scale,
        printGridlines,
        printHeadings,
      }

      const res = await activeSheetPrintPayload(
        ctx,
        {
          notLoaded: t('appPrintNeedsFullLoad'),
          preparing: t('appPrintPreparing'),
        },
        override,
      )

      if (!cancelled) {
        startTransition(() => {
          setPayload(res)
          setLoading(false)
        })
      }
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    orientation,
    paperSize,
    scaleMode,
    customScale,
    marginOption,
    printGridlines,
    printHeadings,
    ctx,
    t,
  ])

  // ESC to close dialog
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [onClose])

  const handlePrint = async () => {
    if (!payload || printing) return
    setPrinting(true)
    try {
      const request: WorkbookExportPdfRequest = {
        ...payload,
        copies: copies > 1 ? copies : undefined,
        duplexMode: duplex,
        collate: copies > 1 ? collate : undefined,
      }
      const res = await window.desktopApi.printWorkbook(request)
      if (res.ok) {
        ctx.setMessage(t('appPrintSent'))
        onClose()
      } else {
        ctx.setMessage(t('appPrintCanceled'))
      }
    } catch {
      ctx.setMessage(t('appPrintFailed'))
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="modal-backdrop print-preview-backdrop" onClick={onClose}>
      <div
        className="modal print-preview-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="print-preview-header">
          <div className="print-preview-title-row">
            <svg
              className="print-preview-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            <h2>{t('appPrintPreviewTitle')}</h2>
          </div>
          <button
            className="print-preview-close-btn"
            onClick={onClose}
            aria-label={t('dlgCancel')}
          >
            ✕
          </button>
        </div>

        <div className="print-preview-body">
          {/* Left Canvas Preview Pane */}
          <div className="print-preview-stage-container">
            <div className="print-preview-toolbar">
              <div className="print-preview-zoom-controls">
                <button
                  type="button"
                  title="Thu nhỏ"
                  disabled={zoom <= 0.4}
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                >
                  −
                </button>
                <span className="print-zoom-label">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  title="Phóng to"
                  disabled={zoom >= 2.0}
                  onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="print-zoom-fit-btn"
                  onClick={() => setZoom(1)}
                >
                  {t('appPrintZoomFit')}
                </button>
              </div>
            </div>

            <div className="print-preview-canvas-wrapper">
              {loading && (
                <div className="print-preview-loading-overlay">
                  <div className="print-preview-spinner" />
                  <span>{t('appPrintGenerating')}</span>
                </div>
              )}
              {payload ? (
                <div
                  className="print-preview-sheet-shadow"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Print Preview Frame"
                    className="print-preview-iframe"
                    srcDoc={payload.html}
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : !loading ? (
                <div className="print-preview-empty-state">
                  <p>{t('appPrintNothing')}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Sidebar Options */}
          <div className="print-preview-sidebar">
            {/* Copies and Collate */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appPrintCopies')}</label>
              <div className="print-preview-row">
                <input
                  type="number"
                  min={1}
                  max={999}
                  className="print-preview-input-number"
                  value={copies}
                  onChange={(e) =>
                    setCopies(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))
                  }
                />
                {copies > 1 && (
                  <label className="print-preview-checkbox-label">
                    <input
                      type="checkbox"
                      checked={collate}
                      onChange={(e) => setCollate(e.target.checked)}
                    />
                    {t('appPrintCollate')}
                  </label>
                )}
              </div>
            </div>

            {/* Print Sides / Duplex */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appPrintSides')}</label>
              <select
                className="print-preview-select"
                value={duplex}
                onChange={(e) => setDuplex(e.target.value as DuplexOption)}
              >
                <option value="simplex">{t('appPrintSidesOneSided')}</option>
                <option value="longEdge">{t('appPrintSidesDuplexLong')}</option>
                <option value="shortEdge">{t('appPrintSidesDuplexShort')}</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appOrientationLabel')}</label>
              <div className="print-preview-toggle-group">
                <button
                  type="button"
                  className={`print-toggle-btn ${orientation === 'portrait' ? 'active' : ''}`}
                  onClick={() => setOrientation('portrait')}
                >
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                    <rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {t('appOrientationPortrait')}
                </button>
                <button
                  type="button"
                  className={`print-toggle-btn ${orientation === 'landscape' ? 'active' : ''}`}
                  onClick={() => setOrientation('landscape')}
                >
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                    <rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {t('appOrientationLandscape')}
                </button>
              </div>
            </div>

            {/* Paper Size */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appSizeLabel')}</label>
              <select
                className="print-preview-select"
                value={paperSize}
                onChange={(e) => setPaperSize(Number(e.target.value))}
              >
                {PAPER_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Scaling */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appPrintScaling')}</label>
              <select
                className="print-preview-select"
                value={scaleMode}
                onChange={(e) => setScaleMode(e.target.value as ScaleOption)}
              >
                <option value="actual">{t('appPrintScaleActual')}</option>
                <option value="fitPage">{t('appPrintScaleFitPage')}</option>
                <option value="fitCols">{t('appPrintScaleFitCols')}</option>
                <option value="fitRows">{t('appPrintScaleFitRows')}</option>
                <option value="custom">{t('appPrintScaleCustom', { scale: customScale })}</option>
              </select>
              {scaleMode === 'custom' && (
                <div className="print-preview-scale-slider-row">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={customScale}
                    onChange={(e) => setCustomScale(Number(e.target.value))}
                    className="print-preview-slider"
                  />
                  <span className="print-scale-pct">{customScale}%</span>
                </div>
              )}
            </div>

            {/* Margins */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appMargins')}</label>
              <select
                className="print-preview-select"
                value={marginOption}
                onChange={(e) => setMarginOption(e.target.value as MarginOption)}
              >
                <option value="normal">{t('appMarginsNormal')}</option>
                <option value="wide">{t('appMarginsWide')}</option>
                <option value="narrow">{t('appMarginsNarrow')}</option>
              </select>
            </div>

            {/* Sheet Options: Gridlines & Headings */}
            <div className="print-preview-group">
              <label className="print-preview-label">{t('appGroupSheetOptions')}</label>
              <div className="print-preview-checkboxes">
                <label className="print-preview-checkbox-label">
                  <input
                    type="checkbox"
                    checked={printGridlines}
                    onChange={(e) => setPrintGridlines(e.target.checked)}
                  />
                  {t('appPrintGridlinesTitle')}
                </label>
                <label className="print-preview-checkbox-label">
                  <input
                    type="checkbox"
                    checked={printHeadings}
                    onChange={(e) => setPrintHeadings(e.target.checked)}
                  />
                  {t('appPrintHeadingsTitle')}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="print-preview-footer">
          <button type="button" className="print-preview-cancel-btn" onClick={onClose}>
            {t('dlgCancel')}
          </button>
          <button
            type="button"
            className="print-preview-submit-btn"
            disabled={!payload || printing || loading}
            onClick={() => void handlePrint()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            <span>{printing ? t('appPrintPreparing') : t('appPrintBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
