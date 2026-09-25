/**
 * Telemetry Scope signals: pure, seeded and periodic.
 *
 * Every signal is defined on u ∈ [0, 1) (one lane-width) and repeats exactly at u = 1, so the
 * drawn geometry can tile ×2 and drift sideways forever without a seam. Nothing here touches the
 * DOM or Math.random: the same (w, h) always yields the same path strings (SSR === client).
 *
 * "Untuned" (right of the scanline) and "tuned" (left of it) are two readings of the same
 * underlying signal, so the scanline reads as a lens that tunes whatever passes through it.
 * These are ILLUSTRATIVE shapes, not data: there are no values, axes or units anywhere.
 */
import { fbm1D, mulberry32, noise1D } from "@/lib/motion/math"

/** Server-render geometry (viewBox 0 0 1600 700, preserveAspectRatio "xMidYMid slice"). */
export const SCOPE_SSR = { w: 1600, h: 700 } as const

export const SCOPE_LANES = [
  { key: "spend", label: "01 · SPEND" },
  { key: "alerts", label: "02 · ALERTS" },
  { key: "releases", label: "03 · RELEASES" },
  { key: "knowledge", label: "04 · KNOWLEDGE" },
] as const

/** Inner padding of each lane's plot area, as a fraction of the lane height (top and bottom). */
export const LANE_PAD = 0.18

/** Samples per lane-width for the continuous signals (shape is independent of pixel width). */
const N = 240

export type ScopeGeometry = {
  /** geometry width of ONE tile (px, or SSR units) */
  w: number
  h: number
  /** drawn width (w · tiles) */
  span: number
  /** static graticule (does not drift) */
  grid: { verticals: string; dividers: string; ticks: string }
  untuned: {
    hatch: string
    provisioned: string
    noiseBase: string
    spikes: string
    spikesAlarm: string
    bars: string
    barsAlarm: string
    barsX: string
    dots: string
  }
  tuned: {
    fill: string
    provisioned: string
    base: string
    alerts: string
    alertHeads: string
    goTicks: string
    link: string
    dots: string
  }
  common: { usage: string }
}

// ---------------------------------------------------------------- the underlying signals (u-space)

const usageNoise = fbm1D(11, 3, 6)
/** fbm1 over one period, normalised to [-1, 1] so the seeded shape uses its full amplitude. */
const fbmSamples = (() => {
  const raw = Array.from({ length: N }, (_, j) => usageNoise((6 * j) / N))
  const lo = Math.min(...raw)
  const hi = Math.max(...raw)
  return raw.map((v) => ((v - lo) / (hi - lo)) * 2 - 1)
})()
/** Lane 1 real usage, 0..1 of the plot height: .35 + .18·fbm1(6u). */
const usageSamples = fbmSamples.map((n) => 0.35 + 0.18 * n)

/** quantize(maxWindow(usage), .25) + .2: the "provisioned for the worst week" staircase. */
const provisionedSamples = (() => {
  const win = Math.round(N * 0.05)
  return usageSamples.map((_, j) => {
    let m = -Infinity
    for (let k = -win; k <= win; k++) m = Math.max(m, usageSamples[(j + k + N) % N])
    return Math.ceil(m / 0.25) * 0.25 + 0.2
  })
})()

const baseNoise = noise1D(23, 80)
/** Lane 2 noisy baseline. */
const alertBase = (u: number) => 0.1 + 0.035 * baseNoise(80 * u)

type Feature = { u: number; v: number }

/** 40 spikes per lane-width, hashed heights; every 5th is an alarm. */
const SPIKES: Feature[] = (() => {
  const r = mulberry32(31)
  return Array.from({ length: 40 }, (_, k) => ({ u: (k + 0.2 + 0.6 * r()) / 40, v: 0.28 + 0.72 * Math.pow(r(), 1.3) }))
})()

/** Lane 3: tall blocky big-bang releases, ~every .3 of the width; every third is an alarm. */
const BARS: Feature[] = (() => {
  const r = mulberry32(47)
  return Array.from({ length: 3 }, (_, k) => ({ u: (k + 0.18 + 0.4 * r()) / 3, v: 0.62 + 0.36 * r() }))
})()
const BAR_W = 0.045

/** Lane 4: isolated knowledge fragments; tuned, the same dots get joined up. */
const DOTS: Feature[] = (() => {
  const r = mulberry32(59)
  return Array.from({ length: 14 }, (_, k) => ({ u: (k + 0.15 + 0.7 * r()) / 14, v: 0.16 + 0.68 * r() }))
})()

// ---------------------------------------------------------------- geometry helpers

const r1 = (v: number) => Math.round(v * 10) / 10
/** Snap to the pixel centre so 1px strokes stay crisp. */
const px = (v: number) => Math.round(v - 0.5) + 0.5

function lane(i: number, h: number) {
  const lh = h / 4
  const top = i * lh + LANE_PAD * lh
  const bottom = (i + 1) * lh - LANE_PAD * lh
  return { top, bottom, y: (v: number) => bottom - v * (bottom - top) }
}

const dot = (x: number, y: number, r: number) =>
  `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`

/** Sampled polyline of a per-sample value array across `tiles` tiles. */
function sampled(values: number[], w: number, tiles: number, y: (v: number) => number, move = true) {
  let d = ""
  const total = N * tiles
  for (let j = 0; j <= total; j++) {
    const x = (j / N) * w
    d += `${j === 0 && move ? "M" : "L"}${r1(x)} ${r1(y(values[j % N]))}`
  }
  return d
}

/**
 * Build every path for a scope of one tile width `w` and height `h`, drawn across `tiles` tiles
 * (1 for the server render, 2 once measured so it can drift).
 */
export function buildScope(w: number, h: number, tiles: 1 | 2): ScopeGeometry {
  const span = w * tiles
  const L1 = lane(0, h)
  const L2 = lane(1, h)
  const L3 = lane(2, h)
  const L4 = lane(3, h)
  const each = (fn: (off: number) => string) => {
    let s = ""
    for (let t = 0; t < tiles + 1; t++) s += fn(t * w)
    return s
  }

  // ---- static graticule
  let verticals = ""
  for (let k = 1; k < 12; k++) verticals += `M${px((k * w) / 12)} 0V${h}`
  let dividers = ""
  for (let k = 1; k < 4; k++) dividers += `M0 ${px((k * h) / 4)}H${w}`
  let ticks = ""
  const mid = px(h / 2)
  for (let k = 1; k < 48; k++) {
    const x = px((k * w) / 48)
    const len = k % 4 === 0 ? 6 : 3
    ticks += `M${x} ${mid - len}V${mid + len}`
  }

  // ---- lane 1: spend
  const usageD = sampled(usageSamples, w, tiles, L1.y)
  const tunedProv = usageSamples.map((v) => v + 0.04)
  const tunedProvD = sampled(tunedProv, w, tiles, L1.y)
  const tunedFill = `${tunedProvD}L${r1(span)} ${r1(L1.bottom)}L0 ${r1(L1.bottom)}Z`

  // stepped staircase (horizontal runs, vertical risers)
  let provD = ""
  let hatch = ""
  {
    const total = N * tiles
    let level = provisionedSamples[0]
    provD = `M0 ${r1(L1.y(level))}`
    for (let j = 1; j <= total; j++) {
      const next = provisionedSamples[j % N]
      if (next !== level) {
        const x = r1((j / N) * w)
        provD += `H${x}V${r1(L1.y(next))}`
        level = next
      }
    }
    provD += `H${r1(span)}`
    // hatch polygon = staircase forward, usage backward
    let back = ""
    for (let j = total; j >= 0; j--) back += `L${r1((j / N) * w)} ${r1(L1.y(usageSamples[j % N]))}`
    hatch = `${provD}${back}Z`
  }

  // ---- lane 2: alerts
  const baseSamples = Array.from({ length: N }, (_, j) => alertBase(j / N))
  const noiseBase = sampled(baseSamples, w, tiles, L2.y)
  const spikePath = (alarm: boolean) =>
    each((off) =>
      SPIKES.filter((_, k) => (k % 5 === 4) === alarm)
        .map((s) => {
          const x = px(off + s.u * w)
          return `M${x} ${r1(L2.y(alertBase(s.u)))}V${r1(L2.y(s.v))}`
        })
        .join(""),
    )
  const baseY = px(L2.y(0.1))
  const tunedBase = `M0 ${baseY}H${r1(span)}`
  let alerts = ""
  let alertHeads = ""
  for (let t = 0; t < tiles + 1; t++) {
    for (let k = 0; k < 3; k++) {
      const x = px(t * w + ((k + 0.5) / 3) * w)
      const top = r1(L2.y(0.46))
      alerts += `M${x} ${baseY}V${top}`
      alertHeads += dot(x, top, 2.5)
    }
  }

  // ---- lane 3: releases
  const bw = Math.max(8, BAR_W * w)
  const barPath = (alarm: boolean) =>
    each((off) =>
      BARS.filter((_, k) => (k === 2) === alarm)
        .map((b) => {
          const x0 = px(off + b.u * w - bw / 2)
          const x1 = px(off + b.u * w + bw / 2)
          const y0 = px(L3.y(0))
          const y1 = px(L3.y(b.v))
          return `M${x0} ${y0}V${y1}H${x1}V${y0}Z`
        })
        .join(""),
    )
  const barsX = each((off) => {
    const b = BARS[2]
    const cx = off + b.u * w
    const cy = L3.y(b.v) - 9
    const s = 3.5
    return `M${r1(cx - s)} ${r1(cy - s)}L${r1(cx + s)} ${r1(cy + s)}M${r1(cx + s)} ${r1(cy - s)}L${r1(cx - s)} ${r1(cy + s)}`
  })
  let goTicks = ""
  for (let t = 0; t < tiles + 1; t++) {
    for (let k = 0; k < 25; k++) {
      const x = px(t * w + ((k + 0.5) / 25) * w)
      goTicks += `M${x} ${r1(L3.y(0))}V${r1(L3.y(0.24))}`
    }
  }

  // ---- lane 4: knowledge
  let dots = ""
  let tunedDots = ""
  let link = ""
  for (let t = 0; t < tiles + 1; t++) {
    DOTS.forEach((p, k) => {
      const x = t * w + p.u * w
      const y = L4.y(p.v)
      dots += dot(x, y, 2.5)
      tunedDots += dot(x, y, 2.5)
      link += `${t === 0 && k === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`
    })
  }
  // lead-in from the last dot of the previous tile so the line enters from the left edge
  const last = DOTS[DOTS.length - 1]
  link = `M${r1(last.u * w - w)} ${r1(L4.y(last.v))}L` + link.slice(1)

  return {
    w,
    h,
    span,
    grid: { verticals, dividers, ticks },
    untuned: {
      hatch,
      provisioned: provD,
      noiseBase,
      spikes: spikePath(false),
      spikesAlarm: spikePath(true),
      bars: barPath(false),
      barsAlarm: barPath(true),
      barsX,
      dots,
    },
    tuned: {
      fill: tunedFill,
      provisioned: tunedProvD,
      base: tunedBase,
      alerts,
      alertHeads,
      goTicks,
      link,
      dots: tunedDots,
    },
    common: { usage: usageD },
  }
}
