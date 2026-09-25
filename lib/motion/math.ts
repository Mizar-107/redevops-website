/**
 * Pure, SSR-safe motion math. No DOM, no Math.random, no Date.
 */
import { EASE, type EaseName } from "./tokens"

export type Pt = { x: number; y: number }

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : (v - a) / (b - a))
/** Progress of v through [a, b], clamped to 0..1. */
export const seg = (v: number, a: number, b: number) => clamp(invLerp(a, b, v))
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp(invLerp(e0, e1, x))
  return t * t * (3 - 2 * t)
}
export const fract = (x: number) => x - Math.floor(x)

/**
 * CSS cubic-bezier(x1, y1, x2, y2) as a JS easing function (Newton-Raphson with bisection fallback),
 * matching the browser implementation closely enough for scrubbed animation.
 */
export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const solveX = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      if (Math.abs(err) < 1e-6) return t
      const d = sampleDX(t)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const v = sampleX(t)
      if (Math.abs(v - x) < 1e-6) return t
      if (x > v) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }
  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return sampleY(solveX(t))
  }
}

/** JS twins of EASE, for scrubbed (pure-function-of-progress) animation. */
export const ease = Object.fromEntries(
  (Object.keys(EASE) as EaseName[]).map((k) => [k, bezier(...(EASE[k] as unknown as [number, number, number, number]))]),
) as Record<EaseName, (t: number) => number>

/** Deterministic PRNG. Same seed → same sequence on server and client. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededArray(seed: number, n: number, min = 0, max = 1): number[] {
  const r = mulberry32(seed)
  return Array.from({ length: n }, () => lerp(min, max, r()))
}

/**
 * Seeded 1D value noise in [-1, 1], smooth (cosine-free quintic interpolation), periodic every
 * `period` units if provided.
 */
export function noise1D(seed: number, period = 256): (x: number) => number {
  const r = mulberry32(seed)
  const table = Array.from({ length: period }, () => r() * 2 - 1)
  return (x: number) => {
    const i = Math.floor(x)
    const t = x - i
    const u = t * t * t * (t * (t * 6 - 15) + 10)
    const a = table[((i % period) + period) % period]
    const b = table[(((i + 1) % period) + period) % period]
    return a + (b - a) * u
  }
}

/** Seeded fractal (fbm) 1D noise in roughly [-1, 1]. */
export function fbm1D(seed: number, octaves = 4, period = 256): (x: number) => number {
  const layers = Array.from({ length: octaves }, (_, i) => noise1D(seed + i * 101, period))
  let norm = 0
  for (let i = 0; i < octaves; i++) norm += Math.pow(0.5, i)
  return (x: number) => {
    let v = 0
    for (let i = 0; i < octaves; i++) v += layers[i](x * Math.pow(2, i)) * Math.pow(0.5, i)
    return v / norm
  }
}

/** Arc-length resample a polyline to exactly n points (default 96). */
export function resample(points: Pt[], n = 96): Pt[] {
  if (points.length === 0) return Array.from({ length: n }, () => ({ x: 0, y: 0 }))
  if (points.length === 1) return Array.from({ length: n }, () => ({ ...points[0] }))
  const cum = [0]
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  }
  const total = cum[cum.length - 1]
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0] }))
  const out: Pt[] = []
  let j = 1
  for (let i = 0; i < n; i++) {
    const target = (total * i) / (n - 1)
    while (j < points.length - 1 && cum[j] < target) j++
    const span = cum[j] - cum[j - 1]
    const t = span === 0 ? 0 : (target - cum[j - 1]) / span
    out.push({ x: lerp(points[j - 1].x, points[j].x, t), y: lerp(points[j - 1].y, points[j].y, t) })
  }
  return out
}

/** Straight per-point mix of two equal-length point lists. */
export function mixPts(a: Pt[], b: Pt[], t: number): Pt[] {
  const n = Math.min(a.length, b.length)
  const out: Pt[] = new Array(n)
  for (let i = 0; i < n; i++) out[i] = { x: lerp(a[i].x, b[i].x, t), y: lerp(a[i].y, b[i].y, t) }
  return out
}

/**
 * Morph a → b with a left-to-right per-point stagger:
 * t_i = e(clamp((t − span·i/(n−1)) / (1 − span))).
 */
export function morph(a: Pt[], b: Pt[], t: number, span = 0.35, e: (t: number) => number = ease.iris): Pt[] {
  const n = Math.min(a.length, b.length)
  const out: Pt[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const ti = e(clamp((t - (span * i) / Math.max(1, n - 1)) / (1 - span)))
    out[i] = { x: lerp(a[i].x, b[i].x, ti), y: lerp(a[i].y, b[i].y, ti) }
  }
  return out
}

const r1 = (v: number) => Math.round(v * 10) / 10

/**
 * SVG path data for a point list. smooth → centripetal Catmull-Rom (α = 0.5) converted to cubic
 * béziers; otherwise a polyline.
 */
export function pathD(points: Pt[], opts: { smooth?: boolean } = {}): string {
  const n = points.length
  if (n === 0) return ""
  let d = `M${r1(points[0].x)} ${r1(points[0].y)}`
  if (!opts.smooth || n < 3) {
    for (let i = 1; i < n; i++) d += `L${r1(points[i].x)} ${r1(points[i].y)}`
    return d
  }
  const alpha = 0.5
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < n ? i + 2 : n - 1]
    const d1 = Math.pow(Math.hypot(p1.x - p0.x, p1.y - p0.y), alpha)
    const d2 = Math.pow(Math.hypot(p2.x - p1.x, p2.y - p1.y), alpha)
    const d3 = Math.pow(Math.hypot(p3.x - p2.x, p3.y - p2.y), alpha)
    let b1: Pt
    let b2: Pt
    if (d1 < 1e-6 || d2 < 1e-6) b1 = p1
    else {
      const a = d1 * d1
      const b = d2 * d2
      const c = 2 * a + 3 * d1 * d2 + b
      const m = 3 * d1 * (d1 + d2)
      b1 = { x: (a * p2.x - b * p0.x + c * p1.x) / m, y: (a * p2.y - b * p0.y + c * p1.y) / m }
    }
    if (d3 < 1e-6 || d2 < 1e-6) b2 = p2
    else {
      const a = d3 * d3
      const b = d2 * d2
      const c = 2 * a + 3 * d3 * d2 + b
      const m = 3 * d3 * (d3 + d2)
      b2 = { x: (a * p1.x - b * p3.x + c * p2.x) / m, y: (a * p1.y - b * p3.y + c * p2.y) / m }
    }
    d += `C${r1(b1.x)} ${r1(b1.y)} ${r1(b2.x)} ${r1(b2.y)} ${r1(p2.x)} ${r1(p2.y)}`
  }
  return d
}

const pad2 = (v: number) => String(v).padStart(2, "0")

/** Frames → "HH:MM:SS:FF". */
export function formatTC(frames: number, fps = 24): string {
  const fr = Math.max(0, Math.floor(frames))
  const ff = fr % fps
  const totalSec = Math.floor(fr / fps)
  const ss = totalSec % 60
  const mm = Math.floor(totalSec / 60) % 60
  const hh = Math.floor(totalSec / 3600)
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}:${pad2(ff)}`
}

/** Scroll position → timecode frames (4px of scroll per frame). */
export const scrollFrames = (scrollY: number) => Math.floor(Math.max(0, scrollY) / 4)

const hexToRgb = (h: string) => {
  const s = h.replace("#", "")
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

/** Mix two #RRGGBB colours; returns #rrggbb. */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const k = clamp(t)
  const c = (x: number, y: number) => Math.round(lerp(x, y, k)).toString(16).padStart(2, "0")
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`
}
