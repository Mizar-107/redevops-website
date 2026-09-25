/**
 * Shared machinery and small SVG bits for the four Services scenes.
 *
 * The scene contract: Furniture is a pure function of progress v. Each scene describes its whole
 * picture as a `SceneFrame` (element key → SVG attributes) computed by a pure `frameAt(v)`. The
 * first render spreads that frame into JSX (so SSR === client at the same v); after mount,
 * `useSceneDriver` subscribes to the progress MotionValue and writes only the attributes that
 * changed, through refs, inside framer's frame loop. Zero React renders per frame.
 */
import { useEffect, useId, useMemo, useRef, type DependencyList } from "react"
import { cancelFrame, frame, type MotionValue } from "framer-motion"
import type { Pt } from "@/lib/motion/math"
import type { SceneMode } from "@/lib/reel/scene"

/* ------------------------------------------------------------------------------------------ */
/* Palette (mirrors §4.1; SVG presentation attributes cannot read CSS vars)                   */
/* ------------------------------------------------------------------------------------------ */

export const C = {
  ink950: "#05060A",
  ink900: "#0A0D14",
  ink850: "#0E121B",
  line: "#1C2230",
  lineStrong: "#2A3242",
  paper: "#ECEFF4",
  paperDim: "#9AA3B2",
  paperMute: "#5D6677",
  signal: "#22D3EE",
  signalHot: "#7CF4FF",
  signalDeep: "#0E7490",
  violet: "#8B5CF6",
  tungsten: "#FFB547",
  alarm: "#FF4D5E",
  go: "#34D399",
} as const

/* ------------------------------------------------------------------------------------------ */
/* Frame description                                                                           */
/* ------------------------------------------------------------------------------------------ */

/** SVG attributes in React (camelCase) spelling. The key `text` writes textContent. */
export type Attrs = Record<string, string | number>
export type SceneFrame = Record<string, Attrs>

/** Round for compact attribute strings (identical on server and client: same math, same code). */
export const n2 = (v: number) => Math.round(v * 100) / 100
export const n1 = (v: number) => Math.round(v * 10) / 10

export const tr = (x: number, y: number) => `translate(${n2(x)} ${n2(y)})`
/** Scale about (cx, cy) as a single matrix. */
export const scaleAt = (sx: number, sy: number, cx: number, cy: number) =>
  `matrix(${n2(sx)} 0 0 ${n2(sy)} ${n2(cx - sx * cx)} ${n2(cy - sy * cy)})`
/** Translate then scale about a local point (px, py) of the translated element. */
export const trScale = (x: number, y: number, s: number, px = 0, py = 0) =>
  `matrix(${n2(s)} 0 0 ${n2(s)} ${n2(x + px - s * px)} ${n2(y + py - s * py)})`

/** Rect subpath for multi-rect paths (one DOM node for many rects). */
export const rectD = (x: number, y: number, w: number, h: number) =>
  w <= 0.01 || h <= 0.01 ? "" : `M${n1(x)} ${n1(y)}h${n1(w)}v${n1(h)}h${n1(-w)}Z`

/** Polyline "d" (no smoothing) for furniture paths. */
export const polyD = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${n1(p.x)} ${n1(p.y)}`).join("")

/* ------------------------------------------------------------------------------------------ */
/* Type metrics                                                                                */
/* ------------------------------------------------------------------------------------------ */

/** Geist Mono advance width (em). */
export const MONO_ADV = 0.6
/** Mono label size in viewBox units: 11, or 22 when compact (§6 W5). */
export const labelSize = (compact?: boolean) => (compact ? 22 : 11)
/** Width of a mono string in viewBox units. tracking in em. */
export const monoW = (s: string, size: number, tracking = 0) =>
  s.length * size * (MONO_ADV + tracking) - size * tracking

/* ------------------------------------------------------------------------------------------ */
/* Driver                                                                                      */
/* ------------------------------------------------------------------------------------------ */

const ATTR_EXCEPTIONS: Record<string, string> = {
  pathLength: "pathLength",
  textLength: "textLength",
  viewBox: "viewBox",
}
const attrName = (k: string) => ATTR_EXCEPTIONS[k] ?? k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())

/** Spread helper: attributes for JSX (drops the `text` pseudo-attribute). */
export function A(a: Attrs | undefined): Record<string, string | number> {
  if (!a) return {}
  if (!("text" in a)) return a
  const { text: _t, ...rest } = a
  return rest
}

/**
 * Drives a scene's furniture from its progress MotionValue.
 * - Render: returns the frame at progress.get() (pure, SSR-safe) plus `reg(key)` ref callbacks.
 * - mode "static": nothing else happens (no subscription, no rAF).
 * - otherwise: progress "change" → frame.update → compute(v) → write changed attributes via refs.
 */
export function useSceneDriver(
  progress: MotionValue<number>,
  mode: SceneMode,
  compute: (v: number) => SceneFrame,
  deps: DependencyList,
): { f: SceneFrame; reg: (key: string) => (el: Element | null) => void } {
  const els = useRef(new Map<string, Element>())
  const regs = useRef(new Map<string, (el: Element | null) => void>())
  const written = useRef(new Map<string, string>())
  const computeRef = useRef(compute)

  const reg = useMemo(
    () => (key: string) => {
      let fn = regs.current.get(key)
      if (!fn) {
        fn = (el: Element | null) => {
          if (el) els.current.set(key, el)
          else els.current.delete(key)
        }
        regs.current.set(key, fn)
      }
      return fn
    },
    [],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => ({ v: progress.get(), f: compute(progress.get()) }), [progress, ...deps])

  useEffect(() => {
    computeRef.current = compute
  })

  useEffect(() => {
    if (mode === "static") return
    const cache = written.current
    cache.clear()

    const write = (fr: SceneFrame) => {
      for (const key in fr) {
        const el = els.current.get(key)
        if (!el) continue
        const a = fr[key]
        for (const k in a) {
          const val = String(a[k])
          const ck = key + "|" + k
          if (cache.get(ck) === val) continue
          cache.set(ck, val)
          if (k === "text") el.textContent = val
          else el.setAttribute(attrName(k), val)
        }
      }
    }

    let rendered = Number.NaN
    let target = progress.get()
    let pending = false
    const run = () => {
      pending = false
      const v = target
      const edge = v === 0 || v === 1
      if (!edge && Math.abs(v - rendered) < 0.0002) return
      if (edge && v === rendered) return
      rendered = v
      write(computeRef.current(v))
    }
    const schedule = (v: number) => {
      target = v
      if (!pending) {
        pending = true
        frame.update(run)
      }
    }
    // Sync once (the DOM may differ from props after a re-render), then follow.
    rendered = Number.NaN
    run()
    const off = progress.on("change", schedule)
    return () => {
      off()
      cancelFrame(run)
    }
  }, [progress, mode, initial])

  return { f: initial.f, reg }
}

/** Stable, url()-safe id prefix for defs (gradients, patterns, clips) per scene instance. */
export function useSvgId(prefix: string) {
  const raw = useId()
  return prefix + raw.replace(/[^a-zA-Z0-9_-]/g, "")
}

/* ------------------------------------------------------------------------------------------ */
/* Small shared SVG bits                                                                        */
/* ------------------------------------------------------------------------------------------ */

type TextAnchor = "start" | "middle" | "end"

/** Mono label (film-leader voice). Size follows compact; colour defaults to paper-mute. */
export function MonoLabel({
  x,
  y,
  children,
  compact,
  size,
  fill = C.paperMute,
  anchor = "start",
  tracking = 0.08,
  upper = false,
  weight = 500,
  ...rest
}: {
  x: number
  y: number
  children?: React.ReactNode
  compact?: boolean
  size?: number
  fill?: string
  anchor?: TextAnchor
  tracking?: number
  upper?: boolean
  weight?: number
  ref?: React.Ref<SVGTextElement>
  opacity?: number | string
  transform?: string
}) {
  const fs = size ?? labelSize(compact)
  return (
    <text
      x={x}
      y={y}
      className={upper ? "font-mono uppercase" : "font-mono"}
      fontSize={fs}
      fontWeight={weight}
      letterSpacing={`${tracking}em`}
      fill={fill}
      textAnchor={anchor}
      {...rest}
    >
      {children}
    </text>
  )
}

/**
 * Redaction blocks ▮▮▮ as one path: amounts are never shown, only their shape.
 * Returns the d for n blocks starting at (x, y).
 */
export const redactionD = (x: number, y: number, n: number, w: number, h: number, gap: number) => {
  let d = ""
  for (let i = 0; i < n; i++) d += rectD(x + i * (w + gap), y, w, h)
  return d
}

/** A redaction line of varied block widths (text-like), one path. */
export const redactionLineD = (x: number, y: number, widths: readonly number[], h: number, gap: number) => {
  let d = ""
  let cx = x
  for (const w of widths) {
    d += rectD(cx, y, w, h)
    cx += w + gap
  }
  return d
}

/** Check glyph centred on (0,0), unit size ~10. Use with pathLength=1 + strokeDashoffset to draw. */
export const CHECK_D = "M-4.2 0.2L-1.3 3.1L4.4 -3.3"

/** Retry glyph ↻ centred on (0,0), radius r: a clockwise 300° arc with an arrowhead at its end. */
export function retryD(r: number) {
  const a0 = (-60 * Math.PI) / 180
  const a1 = (240 * Math.PI) / 180
  const x0 = r * Math.cos(a0)
  const y0 = r * Math.sin(a0)
  const x1 = r * Math.cos(a1)
  const y1 = r * Math.sin(a1)
  const h = r * 0.6
  return (
    `M${n2(x0)} ${n2(y0)}A${n2(r)} ${n2(r)} 0 1 1 ${n2(x1)} ${n2(y1)}` +
    `M${n2(x1 - 0.996 * h)} ${n2(y1 - 0.087 * h)}L${n2(x1)} ${n2(y1)}L${n2(x1 - 0.42 * h)} ${n2(y1 + 0.906 * h)}`
  )
}

/** Folded-corner document glyph at (0,0) top-left, w×h. */
export function docD(w: number, h: number) {
  const k = w * 0.35
  return `M0 0H${n2(w - k)}L${n2(w)} ${n2(k)}V${n2(h)}H0Z M${n2(w - k)} 0V${n2(k)}H${n2(w)}`
}

/**
 * Exactly-n point list from a corner polyline, keeping every corner exactly (so stepped shapes
 * stay crisp under polyline rendering) and filling the rest by arc length.
 */
export function fillCorners(corners: Pt[], n: number): Pt[] {
  const m = corners.length
  if (m >= n) return corners.slice(0, n)
  const segs = m - 1
  const lens: number[] = []
  let total = 0
  for (let i = 0; i < segs; i++) {
    const l = Math.hypot(corners[i + 1].x - corners[i].x, corners[i + 1].y - corners[i].y)
    lens.push(l)
    total += l
  }
  const extra = n - m
  const alloc = new Array<number>(segs).fill(0)
  if (total > 0) {
    const raw = lens.map((l) => (l / total) * extra)
    let used = 0
    for (let i = 0; i < segs; i++) {
      alloc[i] = Math.floor(raw[i])
      used += alloc[i]
    }
    const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
    for (let k = 0; used < extra; k = (k + 1) % segs, used++) alloc[order[k][1]]++
  } else {
    alloc[0] = extra
  }
  const out: Pt[] = []
  for (let i = 0; i < segs; i++) {
    const a = corners[i]
    const b = corners[i + 1]
    out.push(a)
    const k = alloc[i]
    for (let j = 1; j <= k; j++) {
      const t = j / (k + 1)
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  out.push(corners[m - 1])
  return out
}
