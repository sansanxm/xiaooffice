import { describe, expect, it } from 'vitest'

import {
  borderSnapDeltaPx,
  borderWidthPx,
  tableBordersCss,
} from '../src/renderer/editor/extensions'

describe('tableBordersCss', () => {
  it('emits edge variables for declared sides and none otherwise', () => {
    const css = tableBordersCss({ top: { style: 'single', szEighths: 4, color: '000000' } })
    expect(css).toContain('--doc-b-t:1px solid #000000')
    expect(css).toContain('--doc-b-b:none')
    expect(css).toContain('--doc-b-h:none')
    expect(css).toContain('--doc-b-v:none')
  })

  it('emits insideH/insideV variables for table-level inner borders', () => {
    const css = tableBordersCss({
      insideH: { style: 'single', szEighths: 4, color: 'FF0000' },
      insideV: { style: 'single', szEighths: 12, color: '0000FF' },
    })
    expect(css).toContain('--doc-b-h:1px solid #FF0000')
    expect(css).toContain('--doc-b-v:2px solid #0000FF')
  })

  it('returns no declarations for a null attr', () => {
    expect(tableBordersCss(null)).toEqual([])
  })

  it('keeps the dash family dashed at any width instead of merging thick lines into a block', () => {
    const css = tableBordersCss({
      top: { style: 'dashSmallGap', szEighths: 255, color: 'auto' },
      insideV: { style: 'dotDash', szEighths: 12 },
    })
    expect(css).toContain('--doc-b-t:43px dashed #000')
    expect(css).toContain('--doc-b-v:2px dashed #000')
  })

  it('draws compound families as double lines at their full thickness', () => {
    // thin 0.75 + gap 0.75 + 3pt + gap 0.75 + thin 0.75 = 6pt
    const line = { style: 'thinThickThinSmallGap', szEighths: 24 }
    expect(tableBordersCss({ insideH: line })).toContain('--doc-b-h:8px double #000')
    expect(borderWidthPx(line)).toBe(8)
    expect(borderSnapDeltaPx(line)).toBeCloseTo((6 / 72) * 96 - 8, 5)
    expect(borderWidthPx({ style: 'double', szEighths: 12 })).toBe(6)
    expect(borderWidthPx({ style: 'triple', szEighths: 4 })).toBe(3)
    expect(borderWidthPx({ style: 'thinThickLargeGap', szEighths: 48 })).toBe(11)
    expect(borderWidthPx({ style: 'thinThickThinMediumGap', szEighths: 8 })).toBe(4)
  })

  it('emits --doc-b-break using insideH or outer fallback for table pagination breaks', () => {
    const withInsideH = tableBordersCss({
      top: { style: 'single', szEighths: 4, color: '000000' },
      insideH: { style: 'single', szEighths: 8, color: '00FF00' },
    })
    expect(withInsideH).toContain('--doc-b-break:1px solid #00FF00')

    const fallbackBottom = tableBordersCss({
      bottom: { style: 'single', szEighths: 4, color: '0000FF' },
    })
    expect(fallbackBottom).toContain('--doc-b-break:1px solid #0000FF')

    const fallbackTop = tableBordersCss({
      top: { style: 'single', szEighths: 4, color: 'FF0000' },
    })
    expect(fallbackTop).toContain('--doc-b-break:1px solid #FF0000')

    const none = tableBordersCss({})
    expect(none).toContain('--doc-b-break:none')
  })

  it('makeGapEl sets --gap-tbl-left and --gap-tbl-right', async () => {
    const { makeGapEl } = await import('../src/renderer/editor/pagination-gaps')
    const el = makeGapEl(
      {
        marginTop: 50,
        marginBottom: 50,
        marginLeft: 40,
        marginRight: 40,
        tableLeft: 60,
        tableRight: 70,
      },
      'cell',
    )
    expect(el.style.getPropertyValue('--gap-tbl-left')).toBe('60px')
    expect(el.style.getPropertyValue('--gap-tbl-right')).toBe('70px')
  })
})

