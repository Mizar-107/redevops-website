"use client"

import { useEffect, useImperativeHandle, useRef, type Ref } from "react"
import { cn } from "@/lib/utils"
import { pathD, type Pt } from "@/lib/motion/math"
import { MONITOR } from "@/lib/reel/scene"

/** Stroke endpoints for the problem → resolved tint (the §4.1 tokens). */
export const TUNGSTEN = "#FFB547"
export const SIGNAL = "#22D3EE"

export type SignalFrame = {
  /** 96 points in MONITOR coords */
  pts: Pt[]
  smooth: boolean
  /** #rrggbb */
  color: string
  /** 0..1: draw from the centre outward (engage); omit or 1 for the full line */
  reveal?: number
  /** 0..1 head-dot opacity multiplier (default 1) */
  head?: number
  /** 0..1 whole-line opacity (default 1) */
  opacity?: number
}

export type SignalLineHandle = {
  /** Write one frame imperatively (no React render). Identical writes are skipped. */
  draw(frame: SignalFrame): void
}

export type SignalLineProps = {
  /** SSR / first-paint frame (pure: must equal what the first imperative draw would write) */
  initial: SignalFrame
  className?: string
  ref?: Ref<SignalLineHandle>
}

const dashFor = (reveal: number | undefined) => {
  if (reveal == null || reveal >= 1) return { array: "none", offset: "0" }
  const r = Math.max(0, reveal)
  // pathLength = 1: a single dash of length r, centred (gap 2 > path length so it never repeats)
  return { array: `${r.toFixed(4)} 2`, offset: (r / 2 - 0.5).toFixed(4) }
}

/** Where the head dot sits: the rightmost point, or the leading end of a centre-out reveal. */
const headFor = (f: SignalFrame) => {
  const n = f.pts.length
  if (n === 0) return { x: MONITOR.w, y: MONITOR.mid, o: 0 }
  if (f.reveal != null && f.reveal < 1) {
    const i = Math.round((n - 1) * (0.5 + Math.max(0, f.reveal) / 2))
    return { x: f.pts[i].x, y: f.pts[i].y, o: f.reveal > 0.02 ? (f.head ?? 1) : 0 }
  }
  let best = f.pts[0]
  for (let i = 1; i < n; i++) if (f.pts[i].x >= best.x) best = f.pts[i]
  return { x: best.x, y: best.y, o: f.head ?? 1 }
}

const r1 = (v: number) => Math.round(v * 10) / 10

/**
 * The Throughline inside a monitor: one path drawn twice (8px halo at 14% + 1.5px core, round caps,
 * non-scaling strokes) plus a glowing head dot. `d`, stroke colour, dash and head position are
 * written imperatively through `draw()`; React renders it once.
 */
export function SignalLine({ initial, className, ref }: SignalLineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const haloRef = useRef<SVGPathElement>(null)
  const coreRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const headScaleRef = useRef<SVGGElement>(null)
  const groupRef = useRef<SVGGElement>(null)

  const d0 = pathD(initial.pts, { smooth: initial.smooth })
  const dash0 = dashFor(initial.reveal)
  const head0 = headFor(initial)
  const opacityOf = (f: SignalFrame) =>
    f.reveal != null && f.reveal <= 0.001 ? 0 : Math.max(0, Math.min(1, f.opacity ?? 1))
  const op0 = opacityOf(initial)

  const last = useRef({
    d: d0,
    color: initial.color,
    dash: dash0.array + "|" + dash0.offset,
    head: `${r1(head0.x)},${r1(head0.y)},${head0.o.toFixed(3)}`,
    op: op0.toFixed(3),
  })

  useImperativeHandle(
    ref,
    () => ({
      draw(f: SignalFrame) {
        const halo = haloRef.current
        const core = coreRef.current
        if (!halo || !core) return
        const L = last.current
        const op = opacityOf(f)
        const ops = op.toFixed(3)
        if (ops !== L.op) {
          L.op = ops
          groupRef.current?.setAttribute("opacity", ops)
        }
        if (op === 0) return
        const d = pathD(f.pts, { smooth: f.smooth })
        if (d !== L.d) {
          L.d = d
          halo.setAttribute("d", d)
          core.setAttribute("d", d)
        }
        if (f.color !== L.color) {
          L.color = f.color
          halo.setAttribute("stroke", f.color)
          core.setAttribute("stroke", f.color)
          headRef.current?.setAttribute("fill", f.color)
        }
        const dash = dashFor(f.reveal)
        const dk = dash.array + "|" + dash.offset
        if (dk !== L.dash) {
          L.dash = dk
          for (const p of [halo, core]) {
            p.setAttribute("stroke-dasharray", dash.array)
            p.setAttribute("stroke-dashoffset", dash.offset)
          }
        }
        const h = headFor(f)
        const hk = `${r1(h.x)},${r1(h.y)},${h.o.toFixed(3)}`
        if (hk !== L.head) {
          L.head = hk
          const g = headRef.current
          if (g) {
            g.setAttribute("transform", `translate(${r1(h.x)} ${r1(h.y)})`)
            g.setAttribute("opacity", h.o.toFixed(3))
          }
        }
      },
    }),
    [],
  )

  // Keep the head dot a constant on-screen size whatever the monitor width.
  useEffect(() => {
    const svg = svgRef.current
    const hs = headScaleRef.current
    if (!svg || !hs) return
    const apply = (w: number) => {
      if (w > 0) hs.setAttribute("transform", `scale(${(MONITOR.w / w).toFixed(4)})`)
    }
    apply(svg.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => apply(entries[0].contentRect.width))
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MONITOR.w} ${MONITOR.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none", className)}
    >
      <g ref={groupRef} opacity={op0}>
        <path
          ref={haloRef}
          d={d0}
          fill="none"
          stroke={initial.color}
          strokeOpacity={0.14}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={dash0.array}
          strokeDashoffset={dash0.offset}
        />
        <path
          ref={coreRef}
          d={d0}
          fill="none"
          stroke={initial.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={dash0.array}
          strokeDashoffset={dash0.offset}
        />
        <g
          ref={headRef}
          transform={`translate(${r1(head0.x)} ${r1(head0.y)})`}
          opacity={head0.o}
          fill={initial.color}
        >
          <g ref={headScaleRef}>
            <circle r={11} opacity={0.12} />
            <circle r={5.5} opacity={0.28} />
            <circle r={2.5} />
            <circle r={1.1} fill="#ECEFF4" />
          </g>
        </g>
      </g>
    </svg>
  )
}
