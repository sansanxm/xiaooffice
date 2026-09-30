/**
 * Show tween for the Morph transition — a Konva approximation of PowerPoint "Morph".
 *
 * Pairing rules: elements of the previous and target pages match by a multi-tier cascade:
 *  1. PowerPoint "!!" forced morph name (e.g. !!star -> !!star)
 *  2. Durable cNvPr id (spid/nvId)
 *  3. Exact shape name
 *  4. Picture / image dataUrl
 *  5. Placeholder type (title, body, subtitle, etc.)
 *  6. Matching text content (non-empty)
 *  7. Matching preset geometry
 *  8. Same element type document order fallback
 *
 * Paired elements smoothly tween position, scale, and rotation. If element content or geometry
 * differs, they crossfade in motion. Slide background smoothly crossfades between from and to.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Group } from 'react-konva'
import type { RenderSlide } from '@genoffice/pptx-render'
import type { ShapeKey } from '../../shared/ipc'
import { fillToKonva } from '../konva-adapter'
import { StaticNode } from '../NodeBody'
import {
  buildPlan,
  easeInOutCubic,
  extractNodeText,
  lerp,
  lerpAngle,
  MORPH_MS,
  normalizeAngle,
} from './morph-plan'

export { buildPlan, MORPH_MS } from './morph-plan'

export function MorphStage({
  from,
  to,
  fromKeys,
  toKeys,
  images,
  width,
  onDone,
}: {
  from: RenderSlide
  to: RenderSlide
  fromKeys?: ShapeKey[]
  toKeys?: ShapeKey[]
  images: Map<string, HTMLImageElement>
  width: number
  /** Tween finished (guaranteed to fire only once) */
  onDone: () => void
}) {
  const [t, setT] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      const u = (performance.now() - t0) / MORPH_MS
      if (u >= 1) {
        setT(1)
        onDoneRef.current()
      } else {
        setT(u)
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const plan = useMemo(() => buildPlan(from, to, fromKeys, toKeys), [from, to, fromKeys, toKeys])

  const scale = width / to.widthPx
  const h = to.heightPx * scale
  const bgFrom = fillToKonva(from.background, to.widthPx, to.heightPx, images)
  const bgTo = fillToKonva(to.background, to.widthPx, to.heightPx, images)
  const q = easeInOutCubic(Math.min(1, Math.max(0, t)))

  return (
    <Stage width={width} height={h} listening={false} style={{ pointerEvents: 'none' }}>
      <Layer scaleX={scale} scaleY={scale} listening={false}>
        {/* Background crossfade from previous page to target page */}
        <Rect
          x={0}
          y={0}
          width={to.widthPx}
          height={to.heightPx}
          {...(Object.keys(bgFrom).length ? bgFrom : { fill: '#ffffff' })}
        />
        <Rect
          x={0}
          y={0}
          width={to.widthPx}
          height={to.heightPx}
          opacity={q}
          {...(Object.keys(bgTo).length ? bgTo : { fill: '#ffffff' })}
        />

        {/* Elements unique to the previous page: fade out in place */}
        {plan.leaving.map((n) => (
          <Group key={`out-${n.id}`} opacity={1 - q} listening={false}>
            <StaticNode node={n} images={images} />
          </Group>
        ))}

        {/* Target page elements: paired → geometry tween; new → fade in; decoration → static */}
        {to.nodes.map((n) => {
          if (n.decoration) return <StaticNode key={n.id} node={n} images={images} />
          const f = plan.fromOf.get(n.sourceId)
          if (!f) {
            return (
              <Group key={n.id} opacity={q} listening={false}>
                <StaticNode node={n} images={images} />
              </Group>
            )
          }

          const b0 = f.box
          const b1 = n.box
          const rotDeltaN = normalizeAngle(b0.rotationDeg - b1.rotationDeg)
          const diffAppearance =
            f.type !== n.type ||
            (f as any).presetGeometry !== (n as any).presetGeometry ||
            extractNodeText(f) !== extractNodeText(n)

          if (!diffAppearance) {
            return (
              <Group
                key={n.id}
                x={lerp(b0.centerX, b1.centerX, q)}
                y={lerp(b0.centerY, b1.centerY, q)}
                offsetX={b1.centerX}
                offsetY={b1.centerY}
                scaleX={lerp(b0.w / Math.max(1, b1.w), 1, q)}
                scaleY={lerp(b0.h / Math.max(1, b1.h), 1, q)}
                rotation={lerpAngle(rotDeltaN, 0, q)}
                listening={false}
              >
                <StaticNode node={n} images={images} />
              </Group>
            )
          }

          const rotDeltaF = normalizeAngle(b1.rotationDeg - b0.rotationDeg)
          return (
            <Group key={n.id} listening={false}>
              <Group
                x={lerp(b0.centerX, b1.centerX, q)}
                y={lerp(b0.centerY, b1.centerY, q)}
                offsetX={b0.centerX}
                offsetY={b0.centerY}
                scaleX={lerp(1, b1.w / Math.max(1, b0.w), q)}
                scaleY={lerp(1, b1.h / Math.max(1, b0.h), q)}
                rotation={lerpAngle(0, rotDeltaF, q)}
                opacity={1 - q}
                listening={false}
              >
                <StaticNode node={f} images={images} />
              </Group>
              <Group
                x={lerp(b0.centerX, b1.centerX, q)}
                y={lerp(b0.centerY, b1.centerY, q)}
                offsetX={b1.centerX}
                offsetY={b1.centerY}
                scaleX={lerp(b0.w / Math.max(1, b1.w), 1, q)}
                scaleY={lerp(b0.h / Math.max(1, b1.h), 1, q)}
                rotation={lerpAngle(rotDeltaN, 0, q)}
                opacity={q}
                listening={false}
              >
                <StaticNode node={n} images={images} />
              </Group>
            </Group>
          )
        })}
      </Layer>
    </Stage>
  )
}

