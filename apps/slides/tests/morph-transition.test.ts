import { describe, expect, it } from 'vitest'
import type { RenderNode, RenderSlide, ShapeRenderNode, PictureRenderNode } from '@genoffice/pptx-render'
import { buildPlan } from '../src/renderer/components/morph-plan'

function makeSlide(nodes: RenderNode[]): RenderSlide {
  return {
    widthPx: 960,
    heightPx: 540,
    background: { kind: 'solid', color: '#ffffff' },
    nodes,
  }
}

function makeShapeNode(opts: {
  id: string
  sourceId: string
  x?: number
  y?: number
  w?: number
  h?: number
  rotationDeg?: number
  name?: string
  presetGeometry?: string
  placeholder?: string
  text?: string
}): ShapeRenderNode {
  const x = opts.x ?? 100
  const y = opts.y ?? 100
  const w = opts.w ?? 200
  const h = opts.h ?? 100
  const rotationDeg = opts.rotationDeg ?? 0
  const textLayout = opts.text
    ? {
        lines: [
          {
            runs: [{ text: opts.text, x: 0, baselineY: 20, fontFamily: 'Arial', fontSizePx: 16, color: '#000000', bold: false, italic: false, underline: false, widthPx: 100 }],
            top: 0,
            height: 24,
          },
        ],
        insets: { l: 0, t: 0, r: 0, b: 0 },
        anchor: 'middle' as const,
        fontScale: 1,
        contentHeight: 24,
        wrap: true,
      }
    : undefined

  return {
    id: opts.id,
    sourceId: opts.sourceId,
    type: 'shape',
    name: opts.name,
    box: {
      x,
      y,
      w,
      h,
      rotationDeg,
      centerX: x + w / 2,
      centerY: y + h / 2,
    },
    presetGeometry: opts.presetGeometry ?? 'rect',
    placeholder: opts.placeholder,
    fill: { kind: 'solid', color: '#4f46e5' },
    text: textLayout,
  }
}

function makePicNode(opts: {
  id: string
  sourceId: string
  dataUrl: string
  x?: number
  y?: number
  w?: number
  h?: number
  name?: string
}): PictureRenderNode {
  const x = opts.x ?? 100
  const y = opts.y ?? 100
  const w = opts.w ?? 200
  const h = opts.h ?? 200
  return {
    id: opts.id,
    sourceId: opts.sourceId,
    type: 'picture',
    dataUrl: opts.dataUrl,
    name: opts.name,
    box: {
      x,
      y,
      w,
      h,
      rotationDeg: 0,
      centerX: x + w / 2,
      centerY: y + h / 2,
    },
  }
}

describe('Morph transition buildPlan matching cascade', () => {
  it('Tier 1: pairs shapes by !! bang-bang name override even with different geometry', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 's1-1', sourceId: 'src-1', name: '!!Hero', presetGeometry: 'ellipse' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 's2-1', sourceId: 'src-2', name: '!!Hero', presetGeometry: 'star' }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
    expect(plan.leaving.length).toBe(0)
  })

  it('Tier 2: pairs shapes by stable spid from ShapeKeys', () => {
    const s1 = makeSlide([makeShapeNode({ id: 's1-1', sourceId: 'src-1' })])
    const s2 = makeSlide([makeShapeNode({ id: 's2-1', sourceId: 'src-2' })])
    const keys1 = [{ sourceId: 'src-1', spid: 42, name: 'Rectangle 1' }]
    const keys2 = [{ sourceId: 'src-2', spid: 42, name: 'Different Name' }]

    const plan = buildPlan(s1, s2, keys1, keys2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
  })

  it('Tier 3: pairs shapes by case-insensitive name', () => {
    const s1 = makeSlide([makeShapeNode({ id: 's1-1', sourceId: 'src-1', name: 'Title Box' })])
    const s2 = makeSlide([makeShapeNode({ id: 's2-1', sourceId: 'src-2', name: 'title box' })])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
  })

  it('Tier 4: pairs picture nodes by media dataUrl', () => {
    const s1 = makeSlide([
      makePicNode({ id: 'p1', sourceId: 'pic-1', dataUrl: 'data:image/png;base64,abc123' }),
    ])
    const s2 = makeSlide([
      makePicNode({ id: 'p2', sourceId: 'pic-2', dataUrl: 'data:image/png;base64,abc123' }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('pic-2')?.sourceId).toBe('pic-1')
  })

  it('Tier 5: pairs placeholders by placeholder type', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 't1', sourceId: 'src-t1', placeholder: 'title' }),
      makeShapeNode({ id: 'b1', sourceId: 'src-b1', placeholder: 'body' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 'b2', sourceId: 'src-b2', placeholder: 'body' }),
      makeShapeNode({ id: 't2', sourceId: 'src-t2', placeholder: 'title' }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-t2')?.sourceId).toBe('src-t1')
    expect(plan.fromOf.get('src-b2')?.sourceId).toBe('src-b1')
  })

  it('Tier 6: pairs text nodes by matching text content', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 's1', sourceId: 'src-1', text: 'Welcome to GenOffice' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 's2', sourceId: 'src-2', text: 'Welcome to GenOffice', x: 400, y: 300 }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
  })

  it('Tier 7: pairs shapes by matching presetGeometry', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 's1', sourceId: 'src-1', presetGeometry: 'roundRect' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 's2', sourceId: 'src-2', presetGeometry: 'roundRect', x: 300 }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
  })

  it('Tier 8: pairs remaining elements by type order fallback', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 's1', sourceId: 'src-1', presetGeometry: 'rect' }),
      makePicNode({ id: 'p1', sourceId: 'pic-1', dataUrl: 'data:img1' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 's2', sourceId: 'src-2', presetGeometry: 'hexagon' }),
      makePicNode({ id: 'p2', sourceId: 'pic-2', dataUrl: 'data:img2' }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-2')?.sourceId).toBe('src-1')
    expect(plan.fromOf.get('pic-2')?.sourceId).toBe('pic-1')
  })

  it('correctly tracks leaving nodes and new nodes', () => {
    const s1 = makeSlide([
      makeShapeNode({ id: 'keep1', sourceId: 'src-k1', name: 'Header' }),
      makeShapeNode({ id: 'leave1', sourceId: 'src-l1', name: 'TemporaryBanner' }),
    ])
    const s2 = makeSlide([
      makeShapeNode({ id: 'keep2', sourceId: 'src-k2', name: 'Header' }),
      makePicNode({ id: 'new1', sourceId: 'src-n1', dataUrl: 'data:img_new' }),
    ])

    const plan = buildPlan(s1, s2)
    expect(plan.fromOf.get('src-k2')?.sourceId).toBe('src-k1')
    expect(plan.fromOf.get('src-n1')).toBeUndefined() // new element fades in
    expect(plan.leaving.map((n) => n.sourceId)).toEqual(['src-l1']) // old element fades out
  })

  it('lerpAngle takes the shortest angular path across 0/360 boundary', async () => {
    const { lerpAngle, normalizeAngle } = await import('../src/renderer/components/morph-plan')
    expect(normalizeAngle(370)).toBe(10)
    expect(normalizeAngle(-370)).toBe(-10)
    // From 350 deg to 10 deg: shortest path is +20 deg, so halfway is 360/0 deg
    const mid = lerpAngle(350, 10, 0.5)
    expect(normalizeAngle(mid)).toBe(0)
  })
})
