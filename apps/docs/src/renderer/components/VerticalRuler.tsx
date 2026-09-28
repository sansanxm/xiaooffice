import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { SectionSettings } from '@genoffice/docx-engine'
import { t } from '../i18n/locale'
import { useMeasurement } from '../use-measurement'
import { MAX_RULER_INCHES, INDENT_SNAP_TWIPS, snapIndentTwips, rulerTicks } from './Ruler'

const twipsToPx = (twips: number) => (twips / 1440) * 96
const MAX_RULER_TWIPS = MAX_RULER_INCHES * 1440
const MIN_BODY_TWIPS = 720

export interface VerticalRulerProps {
  section: SectionSettings
  onMarginsChange?: (margins: { top: number; bottom: number }) => void
  onDoubleClick?: () => void
  pageCount?: number
}

function clampMargin(
  side: 'top' | 'bottom',
  valTwips: number,
  pageHeight: number,
  marginTop: number,
  marginBottom: number,
): number {
  if (side === 'top') {
    const max = Math.max(pageHeight - marginBottom - MIN_BODY_TWIPS, 0)
    return Math.min(Math.max(valTwips, 0), max)
  }
  const max = Math.max(pageHeight - marginTop - MIN_BODY_TWIPS, 0)
  return Math.min(Math.max(valTwips, 0), max)
}

function dragGuideHorizontal(rulerRect: DOMRect): {
  moveTo: (y: number) => void
  remove: () => void
} {
  const guide = document.createElement('div')
  guide.className = 'ruler-drag-guide-h'
  document.body.appendChild(guide)
  return {
    moveTo: (y: number) => {
      guide.style.top = `${y}px`
      guide.style.left = `${rulerRect.left}px`
      guide.style.width = '100vw'
    },
    remove: () => {
      guide.remove()
    },
  }
}

interface SinglePageVerticalRulerProps {
  top: number
  section: SectionSettings
  onMarginsChange?: (margins: { top: number; bottom: number }) => void
  onDoubleClick?: () => void
}

function SinglePageVerticalRuler({ top, section, onMarginsChange, onDoubleClick }: SinglePageVerticalRulerProps) {
  const measure = useMeasurement()
  const finite = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback

  const pageHeight = Math.min(finite(section.pageHeight, 15840), MAX_RULER_TWIPS)
  const marginTop = Math.min(finite(section.marginTop, 1440), pageHeight)
  const marginBottom = Math.min(finite(section.marginBottom, 1440), pageHeight)

  const height = Math.round(twipsToPx(pageHeight))
  const marginTopPx = twipsToPx(marginTop)
  const marginBottomPx = twipsToPx(marginBottom)

  const ticks = rulerTicks(pageHeight, marginTop, measure.unit)

  const zoneRefs = useRef<{ top: HTMLElement | null; bottom: HTMLElement | null }>({
    top: null,
    bottom: null,
  })

  const marginAbs = (side: 'top' | 'bottom', value: number) =>
    side === 'top' ? value : pageHeight - value

  const startDrag = (
    e: ReactMouseEvent<HTMLElement>,
    origAbs: number,
    onMove: (abs: number) => void,
    onDrop: (abs: number) => void,
  ) => {
    e.stopPropagation()
    e.preventDefault()
    const ruler = e.currentTarget.closest('.vertical-ruler') as HTMLElement
    const rect = ruler.getBoundingClientRect()
    if (!(rect.height > 0)) return
    const twipsPerPx = pageHeight / rect.height
    const startY = e.clientY
    const guide = dragGuideHorizontal(rect)

    const absAt = (ev: MouseEvent) =>
      ev.clientY === startY
        ? origAbs
        : snapIndentTwips(origAbs + (ev.clientY - startY) * twipsPerPx, !ev.altKey)

    const onMouseMove = (ev: MouseEvent) => {
      const abs = absAt(ev)
      onMove(abs)
      guide.moveTo(rect.top + abs / twipsPerPx)
    }

    const onMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      guide.remove()
      const abs = absAt(ev)
      if (abs !== origAbs) onDrop(abs)
      else onMove(origAbs)
    }

    guide.moveTo(rect.top + origAbs / twipsPerPx)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleMarginMouseDown = (e: ReactMouseEvent<HTMLElement>, side: 'top' | 'bottom') => {
    if (!onMarginsChange) return
    const orig = side === 'top' ? marginTop : marginBottom
    const marginAt = (abs: number) => clampMargin(side, abs, pageHeight, marginTop, marginBottom)

    startDrag(
      e,
      marginAbs(side, orig),
      (abs) => {
        const m = marginAt(abs)
        const zone = zoneRefs.current[side]
        if (!zone) return
        if (side === 'top') {
          zone.style.height = `${twipsToPx(m)}px`
        } else {
          zone.style.top = `${height - twipsToPx(m)}px`
          zone.style.height = `${twipsToPx(m)}px`
        }
      },
      (abs) => {
        const m = marginAt(abs)
        if (m === orig) return
        onMarginsChange({
          top: side === 'top' ? m : marginTop,
          bottom: side === 'bottom' ? m : marginBottom,
        })
      },
    )
  }

  const handleMarginKeyDown = (e: ReactKeyboardEvent<HTMLElement>, side: 'top' | 'bottom') => {
    if (!onMarginsChange || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    const orig = side === 'top' ? marginTop : marginBottom
    const delta = (e.key === 'ArrowDown' ? 1 : -1) * (e.shiftKey ? 720 : INDENT_SNAP_TWIPS)
    const m = clampMargin(
      side,
      snapIndentTwips(marginAbs(side, orig) + delta),
      pageHeight,
      marginTop,
      marginBottom,
    )
    if (m === orig) return
    onMarginsChange({
      top: side === 'top' ? m : marginTop,
      bottom: side === 'bottom' ? m : marginBottom,
    })
  }

  return (
    <div
      className="vertical-ruler"
      role="group"
      aria-label="Thước dọc"
      title={t('ribbonPageSetupDoubleClickTip')}
      style={{ top, height }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick?.()
      }}
    >
      {/* Top margin zone (darker/gray) */}
      <div
        className="vertical-ruler-zone"
        ref={(el) => {
          zoneRefs.current.top = el
        }}
        style={{ top: 0, height: marginTopPx }}
      />

      {/* Bottom margin zone (darker/gray) */}
      <div
        className="vertical-ruler-zone"
        ref={(el) => {
          zoneRefs.current.bottom = el
        }}
        style={{ top: height - marginBottomPx, height: marginBottomPx }}
      />

      {/* Ticks and numbering */}
      {ticks.map((tk) => {
        const tickTop = twipsToPx(tk.pos)
        if (tickTop < 0 || tickTop > height) return null
        return tk.kind === 'num' ? (
          <span key={`v-${tk.pos}`} className="vertical-ruler-num" style={{ top: tickTop }}>
            {tk.label}
          </span>
        ) : (
          <span
            key={`v-${tk.pos}`}
            className={tk.kind === 'mid' ? 'vertical-ruler-tick vertical-ruler-tick-mid' : 'vertical-ruler-tick'}
            style={{ top: tickTop }}
          />
        )
      })}

      {/* Margin handles */}
      {onMarginsChange && (
        <>
          <span
            className="vertical-ruler-margin-handle"
            data-side="top"
            style={{ top: marginTopPx }}
            role="slider"
            tabIndex={0}
            aria-label={t('ribbonMarginTop')}
            aria-valuemin={0}
            aria-valuemax={pageHeight}
            aria-valuenow={marginTop}
            onMouseDown={(e) => handleMarginMouseDown(e, 'top')}
            onKeyDown={(e) => handleMarginKeyDown(e, 'top')}
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className="vertical-ruler-margin-handle"
            data-side="bottom"
            style={{ top: height - marginBottomPx }}
            role="slider"
            tabIndex={0}
            aria-label={t('ribbonMarginBottom')}
            aria-valuemin={0}
            aria-valuemax={pageHeight}
            aria-valuenow={marginBottom}
            onMouseDown={(e) => handleMarginMouseDown(e, 'bottom')}
            onKeyDown={(e) => handleMarginKeyDown(e, 'bottom')}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
    </div>
  )
}

export function VerticalRuler({
  section,
  onMarginsChange,
  onDoubleClick,
  pageCount = 1,
}: VerticalRulerProps) {
  const [pageTops, setPageTops] = useState<number[]>([0])

  useEffect(() => {
    const updateTops = () => {
      const pm = document.querySelector('.editor-scroll .doc-page') as HTMLElement | null
      if (!pm) {
        setPageTops([0])
        return
      }
      const pmRect = pm.getBoundingClientRect()
      const factor = pm.getBoundingClientRect().width / (pm.offsetWidth || 1) || 1
      const gaps = Array.from(pm.querySelectorAll<HTMLElement>('.page-gap:not(.page-gap-carry)'))
      const tops: number[] = [0]
      for (const gap of gaps) {
        const gapRect = gap.getBoundingClientRect()
        const topInPm = (gapRect.bottom - pmRect.top) / factor
        tops.push(Math.round(topInPm))
      }
      const pageHeight = Math.min(section.pageHeight ?? 15840, MAX_RULER_TWIPS)
      const pageHeightPx = Math.round(twipsToPx(pageHeight))
      while (tops.length < pageCount) {
        const lastTop = tops[tops.length - 1]
        tops.push(lastTop + pageHeightPx + 26)
      }
      setPageTops(tops)
    }

    updateTops()
    const timer = setTimeout(updateTops, 150)

    const pm = document.querySelector('.editor-scroll .doc-page')
    if (!pm) return () => clearTimeout(timer)

    const observer = new MutationObserver(updateTops)
    observer.observe(pm, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [pageCount, section.pageHeight])

  return (
    <div className="vertical-rulers-wrapper">
      {pageTops.map((top, idx) => (
        <SinglePageVerticalRuler
          key={`vruler-page-${idx}`}
          top={top}
          section={section}
          onMarginsChange={onMarginsChange}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  )
}
