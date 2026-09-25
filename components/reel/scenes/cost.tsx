/**
 * 01 COST: "Invoice Cut".
 * A monthly cloud bill as twelve stacked columns. The throughline is the bill's silhouette
 * (stepped, smooth: false). AUDIT scans, RIGHTSIZE removes idle and oversized capacity, TIER files
 * half of storage onto a cold shelf, COMMIT drops the commitment line to the new peak, HOLD stamps it.
 * Pure function of v, seeded with mulberry32(11). No digits, no amounts: totals are redaction blocks.
 */
import { clamp, ease, lerp, mixHex, mulberry32, seg, smoothstep, type Pt } from "@/lib/motion/math"
import type { SceneModule, SceneProps } from "@/lib/reel/scene"
import {
  A,
  C,
  fillCorners,
  labelSize,
  monoW,
  n2,
  rectD,
  redactionD,
  scaleAt,
  trScale,
  useSceneDriver,
  useSvgId,
  type SceneFrame,
} from "./shared"

/* ------------------------------------------------------------------------------------------ */
/* Seeded bill                                                                                 */
/* ------------------------------------------------------------------------------------------ */

const N = 12
/** Baseline of the bill (monitor units). */
const B = 420
/** Height scale applied to the seeded ranges so the bill fills the monitor. */
const K = 1.25
const SLOT = 56
const X0 = 64
const X1 = X0 + SLOT * N // 736
const COL_W = 36
const colX = (i: number) => X0 + SLOT * i + 10
const SHELF_Y = 436

const BILL = (() => {
  const r = mulberry32(11)
  const L = (a: number, b: number) => a + (b - a) * r()
  const compute: number[] = []
  const storage: number[] = []
  for (let i = 0; i < N; i++) {
    compute.push(Math.round(L(60, 110)))
    storage.push(Math.round(L(30, 60)))
  }
  const pick = (k: number) => {
    const idx = Array.from({ length: N }, (_, i) => i)
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      const t = idx[i]
      idx[i] = idx[j]
      idx[j] = t
    }
    return new Set(idx.slice(0, k))
  }
  const hasIdle = pick(7)
  const hasOver = pick(5)
  const idle: number[] = []
  const over: number[] = []
  for (let i = 0; i < N; i++) {
    idle.push(hasIdle.has(i) ? Math.round(L(12, 70)) : 0)
    over.push(hasOver.has(i) ? Math.round(L(20, 60)) : 0)
  }
  // idle particles: 6 per idle column (fx, fy, birth jitter)
  const parts = Array.from({ length: N }, () => Array.from({ length: 6 }, () => [r(), r(), r()] as const))
  return {
    compute: compute.map((h) => h * K),
    storage: storage.map((h) => h * K),
    idle: idle.map((h) => h * K),
    over: over.map((h) => h * K),
    parts,
  }
})()

/* ------------------------------------------------------------------------------------------ */
/* Pure state at v                                                                             */
/* ------------------------------------------------------------------------------------------ */

/** RIGHTSIZE local progress of column i (staggered 1.5% of v per column). */
const uRight = (v: number, i: number) => seg(v, 0.25 + 0.015 * i, 0.25 + 0.015 * i + 0.135)
/** TIER local progress of column i. */
const tTier = (v: number, i: number) => seg(v, 0.55 + 0.012 * i, 0.55 + 0.012 * i + 0.068)

type Col = { c: number; s: number; idle: number; over: number; top: number }

function column(v: number, i: number): Col {
  const u = uRight(v, i)
  const o = BILL.over[i]
  const over = u < 0.1 ? o * (1 + 0.04 * ease.title(u / 0.1)) : o * 1.04 * (1 - ease.cut(seg(u, 0.1, 0.6)))
  const idle = BILL.idle[i] * (1 - ease.cut(seg(u, 0.35, 0.95)))
  const t = tTier(v, i)
  const s = BILL.storage[i] * (0.5 + 0.5 * (1 - ease.cut(seg(t, 0, 0.45))))
  const c = BILL.compute[i]
  return { c, s, idle, over, top: B - (c + s + idle + over) }
}

const tops = (v: number) => Array.from({ length: N }, (_, i) => column(v, i).top)
const TOPS0 = tops(0)
const TOPS1 = tops(1)
const MAX0 = Math.min(...TOPS0)
const MAX1 = Math.min(...TOPS1)
const COMMIT_Y0 = MAX0 - 20
const COMMIT_Y1 = MAX1 - 8

/** Stepped silhouette over the column tops (corners kept exactly), 96 points. */
function silhouette(t: number[]): Pt[] {
  const corners: Pt[] = [
    { x: 0, y: B },
    { x: X0, y: B },
  ]
  for (let i = 0; i < N; i++) {
    corners.push({ x: X0 + SLOT * i, y: t[i] }, { x: X0 + SLOT * (i + 1), y: t[i] })
  }
  corners.push({ x: X1, y: B }, { x: 800, y: B })
  return fillCorners(corners, 96)
}

/** Stepped outline d (for the static ghost of the old bill). */
function silhouetteD(t: number[]) {
  let d = `M${X0} ${B}`
  for (let i = 0; i < N; i++) d += `V${n2(t[i])}H${X0 + SLOT * (i + 1)}`
  return d + `V${B}`
}

/** Area between the old and the new silhouette. */
const GAP_D = (() => {
  let d = ""
  for (let i = 0; i < N; i++) d += rectD(X0 + SLOT * i, TOPS0[i], SLOT, TOPS1[i] - TOPS0[i])
  return d
})()
const GHOST_D = silhouetteD(TOPS0)

/* Chips: anchored to seeded columns (the idle-heaviest on the left, the most oversized on the right). */
const IDLE_COL = (() => {
  let best = 0
  for (let i = 0; i < N / 2; i++) if (BILL.idle[i] > BILL.idle[best]) best = i
  return best
})()
const OVER_COL = (() => {
  let best = N / 2
  for (let i = N / 2; i < N; i++) if (BILL.over[i] > BILL.over[best] && TOPS0[i] > MAX0 + 20) best = i
  return best
})()
const MISTIMED_X = 400

const beamX = (v: number) => lerp(X0, X1, seg(v, 0.02, 0.23))
/** v at which the audit beam passes x. */
const passAt = (x: number) => 0.02 + 0.21 * clamp((x - X0) / (X1 - X0))

type Layout = {
  fs: number
  sw: number
  headY: number
  barY: number
  barH: number
  chipH: number
  chipPad: number
  legendY: number
  sw4: number
  stampFs: number
  hatch: number
  part: number
}
const LAYOUT = (compact: boolean): Layout =>
  compact
    ? { fs: 22, sw: 2, headY: 72, barY: 84, barH: 8, chipH: 34, chipPad: 12, legendY: 480, sw4: 14, stampFs: 26, hatch: 8, part: 7 }
    : { fs: 11, sw: 1, headY: 48, barY: 58, barH: 6, chipH: 20, chipPad: 7, legendY: 470, sw4: 8, stampFs: 15, hatch: 4, part: 4 }

const LEGEND = ["compute", "storage", "idle", "oversized", "cold tier"] as const

function legendLayout(L: Layout) {
  let x = L.fs > 11 ? 44 : X0
  const gapItem = L.fs > 11 ? L.fs * 0.8 : L.fs * 1.4
  return LEGEND.map((word) => {
    const sx = x
    const tx = sx + L.sw4 + L.fs * 0.5
    const w = monoW(word, L.fs)
    x = tx + w + gapItem
    return { word, sx, tx, w }
  })
}

const chipW = (label: string, L: Layout) => monoW(label, L.fs, 0.04) + L.chipPad * 2

function frameAt(v: number, compact: boolean): SceneFrame {
  const L = LAYOUT(compact)
  const f: SceneFrame = {}
  const cols = Array.from({ length: N }, (_, i) => column(v, i))

  // stacks: one path per layer
  let dC = ""
  let dS = ""
  let dI = ""
  let dO = ""
  const g = 2 // visual gap between stacked segments
  cols.forEach((col, i) => {
    const x = colX(i)
    let y = B
    dC += rectD(x, y - col.c, COL_W, col.c)
    y -= col.c
    dS += rectD(x, y - col.s + g, COL_W, col.s - g)
    y -= col.s
    dI += rectD(x, y - col.idle + g, COL_W, col.idle - g)
    y -= col.idle
    dO += rectD(x + 0.5, y - col.over + g, COL_W - 1, col.over - g)
  })
  f.compute = { d: dC || "M0 0" }
  f.storage = { d: dS || "M0 0" }
  f.idleDim = { d: dI || "M0 0" }
  f.idleLit = { d: dI || "M0 0" }
  f.overDim = { d: dO || "M0 0" }
  f.overLit = { d: dO || "M0 0" }

  // audit beam + scanned clip
  const bx = beamX(v)
  const beamOn = seg(v, 0, 0.02) * (1 - seg(v, 0.23, 0.25))
  f.beam = { transform: `translate(${n2(bx)} 0)`, opacity: n2(beamOn) }
  f.scanClip = { width: n2(Math.max(0, bx - X0 + 1)) }

  // idle particles
  let dP = ""
  cols.forEach((_, i) => {
    if (!BILL.idle[i]) return
    const u = uRight(v, i)
    const idleTop0 = B - BILL.compute[i] - BILL.storage[i] - BILL.idle[i]
    BILL.parts[i].forEach(([fx, fy, fb], j) => {
      const b = 0.35 + j * 0.05 + fb * 0.04
      const p = seg(u, b, b + 0.3)
      if (p <= 0 || p >= 1) return
      const s = L.part * (1 - p)
      const x = colX(i) + 4 + fx * (COL_W - 8)
      const y = idleTop0 + fy * BILL.idle[i] - 40 * ease.title(p)
      dP += rectD(x - s / 2, y - s / 2, s, s)
    })
  })
  f.particles = { d: dP || "M0 0" }

  // cold tier: shelf, in-flight halves, landed halves
  const shelfOn = seg(v, 0.53, 0.58)
  f.shelf = { opacity: n2(shelfOn), transform: scaleAt(ease.cut(shelfOn), 1, X0, SHELF_Y) }
  let dFly = ""
  let dLand = ""
  const shelfH = compact ? 6 : 4
  cols.forEach((_, i) => {
    const t = tTier(v, i)
    if (t <= 0) return
    const x = colX(i)
    if (t >= 1) {
      dLand += rectD(x, SHELF_Y - shelfH / 2, COL_W, shelfH)
      return
    }
    const e = ease.cut(t)
    const half = BILL.storage[i] / 2
    const y0 = B - BILL.compute[i] - BILL.storage[i]
    const y2 = SHELF_Y - shelfH / 2
    // gentle arc: quadratic bezier with a control point lifted up and to the right
    const cx = x + 20
    const cy = y0 - 18
    const px = (1 - e) * (1 - e) * x + 2 * (1 - e) * e * cx + e * e * x
    const py = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y2
    const h = lerp(half, shelfH, ease.title(seg(t, 0, 0.55)))
    dFly += rectD(px, py, COL_W, h)
  })
  f.fly = { d: dFly || "M0 0" }
  f.land = { d: dLand || "M0 0" }

  // commitment line
  const k = ease.clap(seg(v, 0.75, 0.9))
  const cy = lerp(COMMIT_Y0, COMMIT_Y1, k)
  const cc = mixHex(C.tungsten, C.signal, seg(v, 0.76, 0.88))
  f.commit = { transform: `translate(0 ${n2(cy)})` }
  f.commitLine = { stroke: cc }
  f.commitLabel = { fill: mixHex(C.tungsten, C.paperDim, seg(v, 0.76, 0.88)) }

  // chips
  const chip = (key: string, x: number, pass: number, out: number) => {
    const inn = ease.clap(seg(v, pass, pass + 0.03))
    const o = seg(v, pass, pass + 0.012) * (1 - out)
    f[key] = { transform: trScale(x, 0, 0.6 + 0.4 * inn, 0, 0), opacity: n2(o) }
  }
  const idleCx = colX(IDLE_COL) + COL_W / 2
  const overCx = colX(OVER_COL) + COL_W / 2
  chip("chipIdle", idleCx, passAt(idleCx), seg(uRight(v, IDLE_COL), 0.2, 0.45))
  chip("chipOver", overCx, passAt(overCx), seg(uRight(v, OVER_COL), 0.05, 0.3))
  chip("chipMis", MISTIMED_X, passAt(MISTIMED_X), seg(v, 0.75, 0.79))
  f.chipMisY = { transform: `translate(0 ${n2(cy)})` }

  // total bar: follows the actual removed spend (stack) and the commitment step
  const sumV = cols.reduce((a, c) => a + c.c + c.s + c.idle + c.over, 0)
  const stackR = clamp((SUM0 - sumV) / (SUM0 - SUM1))
  const r = clamp(0.8 * stackR + 0.2 * seg(v, 0.75, 0.9))
  f.bar = { transform: scaleAt(lerp(1, 0.55, r), 1, BAR_X, 0) }
  f.barStop0 = { stopColor: mixHex(C.tungsten, C.signal, r) }
  f.barStop1 = { stopColor: mixHex(C.tungsten, C.signal, 0.35 + 0.65 * r) }

  // legend strikes + cold tier legend item
  const strike = ease.cut(seg(v, 0.3, 0.45))
  const lg = legendLayout(L)
  f.strikeIdle = { transform: scaleAt(strike, 1, lg[2].tx - 2, 0) }
  f.strikeOver = { transform: scaleAt(strike, 1, lg[3].tx - 2, 0) }
  f.legendIdle = { opacity: n2(1 - 0.45 * strike) }
  f.legendOver = { opacity: n2(1 - 0.45 * strike) }
  f.legendTier = { opacity: n2(seg(v, 0.55, 0.62)) }

  // HOLD: ghost of the old bill, the saved area, the stamp
  const hold = seg(v, 0.9, 0.95)
  f.ghost = { opacity: n2(0.2 * hold) }
  f.gap = { opacity: n2(hold) }
  const st = seg(v, 0.9, 0.97)
  const sc = lerp(1.4, 1, ease.clap(st))
  f.stamp = {
    transform: `translate(${STAMP.x} ${compact ? STAMP.y + 20 : STAMP.y}) rotate(-8) scale(${n2(sc)})`,
    opacity: n2(seg(v, 0.9, 0.925)),
  }
  return f
}

const SUM0 = (() => {
  let s = 0
  for (let i = 0; i < N; i++) {
    const c = column(0, i)
    s += c.c + c.s + c.idle + c.over
  }
  return s
})()
const SUM1 = (() => {
  let s = 0
  for (let i = 0; i < N; i++) {
    const c = column(1, i)
    s += c.c + c.s + c.idle + c.over
  }
  return s
})()

const BAR_X = X1 - 240
const STAMP = { x: 604, y: 112 }

/* ------------------------------------------------------------------------------------------ */
/* Furniture                                                                                   */
/* ------------------------------------------------------------------------------------------ */

function Furniture({ progress, mode, compact = false }: SceneProps) {
  const id = useSvgId("cost")
  const { f, reg } = useSceneDriver(progress, mode, (v) => frameAt(v, compact), [compact])
  const L = LAYOUT(compact)
  const fs = labelSize(compact)
  const lg = legendLayout(L)
  const chipY = (top: number) => top - L.chipH - (compact ? 16 : 12)
  const idleTop = TOPS0[IDLE_COL]
  const overTop = TOPS0[OVER_COL]
  const stampW = monoW("RIGHTSIZED", L.stampFs, 0.14) + L.stampFs * 1.6
  const stampH = L.stampFs * 2
  const redW = compact ? 12 : 6
  const redH = compact ? 16 : 9
  const redGap = compact ? 5 : 3
  const redTotal = 5 * redW + 4 * redGap
  const chipText = (label: string, w: number) => (
    <>
      <rect x={-w / 2} y={0} width={w} height={L.chipH} rx={compact ? 6 : 3} fill={C.ink850} stroke={C.tungsten} strokeWidth={L.sw} />
      <text
        x={0}
        y={L.chipH / 2 + fs * 0.36}
        className="font-mono"
        fontSize={fs}
        fontWeight={500}
        letterSpacing="0.04em"
        fill={C.tungsten}
        textAnchor="middle"
      >
        {label}
      </text>
    </>
  )

  return (
    <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={L.hatch} height={L.hatch} patternTransform="rotate(45)">
          <rect width={L.hatch} height={L.hatch} fill={C.tungsten} fillOpacity={0.07} />
          <line x1={0} y1={0} x2={0} y2={L.hatch} stroke={C.tungsten} strokeWidth={L.sw * 1.2} />
        </pattern>
        <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="1" y2="0">
          <stop ref={reg("barStop0")} offset="0" {...A(f.barStop0)} />
          <stop ref={reg("barStop1")} offset="1" {...A(f.barStop1)} />
        </linearGradient>
        <linearGradient id={`${id}-gap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.tungsten} stopOpacity={0.25} />
          <stop offset="1" stopColor={C.tungsten} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-scan`}>
          <rect ref={reg("scanClip")} x={X0 - 1} y={0} height={500} {...A(f.scanClip)} />
        </clipPath>
      </defs>

      {/* grid: baseline + three unlabeled gridlines */}
      <g stroke={C.line} strokeWidth={L.sw}>
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={X0} x2={X1} y1={B - (B - 150) * k} y2={B - (B - 150) * k} />
        ))}
      </g>
      <line x1={X0 - 16} x2={X1 + 16} y1={B + 0.5} y2={B + 0.5} stroke={C.lineStrong} strokeWidth={L.sw} />

      {/* HOLD: saved spend (between ghost and new bill), then the ghost silhouette */}
      <path ref={reg("gap")} d={GAP_D} fill={`url(#${id}-gap)`} {...A(f.gap)} />
      <path
        ref={reg("ghost")}
        d={GHOST_D}
        fill="none"
        stroke={C.paperDim}
        strokeWidth={L.sw}
        strokeDasharray={compact ? "8 6" : "4 3"}
        {...A(f.ghost)}
      />

      {/* the stacks */}
      <path ref={reg("compute")} fill={C.signalDeep} fillOpacity={0.45} {...A(f.compute)} />
      <path ref={reg("storage")} fill={C.violet} fillOpacity={0.35} {...A(f.storage)} />
      <path ref={reg("idleDim")} fill={`url(#${id}-hatch)`} opacity={0.55} {...A(f.idleDim)} />
      <path ref={reg("idleLit")} fill={`url(#${id}-hatch)`} clipPath={`url(#${id}-scan)`} {...A(f.idleLit)} />
      <path
        ref={reg("overDim")}
        fill={C.tungsten}
        fillOpacity={0.05}
        stroke={C.tungsten}
        strokeWidth={L.sw}
        strokeDasharray={compact ? "6 4" : "3 2"}
        opacity={0.55}
        {...A(f.overDim)}
      />
      <path
        ref={reg("overLit")}
        fill={C.tungsten}
        fillOpacity={0.08}
        stroke={C.tungsten}
        strokeWidth={L.sw}
        strokeDasharray={compact ? "6 4" : "3 2"}
        clipPath={`url(#${id}-scan)`}
        {...A(f.overLit)}
      />

      {/* cold tier */}
      <line
        ref={reg("shelf")}
        x1={X0}
        x2={X1}
        y1={SHELF_Y}
        y2={SHELF_Y}
        stroke={C.signalDeep}
        strokeWidth={L.sw}
        {...A(f.shelf)}
      />
      <path ref={reg("land")} fill={C.signalDeep} {...A(f.land)} />
      <path ref={reg("fly")} fill={C.violet} fillOpacity={0.5} {...A(f.fly)} />
      <path ref={reg("particles")} fill={C.tungsten} fillOpacity={0.85} {...A(f.particles)} />

      {/* commitment line */}
      <g ref={reg("commit")} {...A(f.commit)}>
        <line
          ref={reg("commitLine")}
          x1={X0}
          x2={X1}
          y1={0}
          y2={0}
          strokeWidth={L.sw}
          strokeDasharray={compact ? "10 7" : "6 4"}
          {...A(f.commitLine)}
        />
        <text
          ref={reg("commitLabel")}
          x={X1}
          y={-(compact ? 9 : 6)}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          textAnchor="end"
          {...A(f.commitLabel)}
        >
          commitment
        </text>
      </g>

      {/* audit beam */}
      <g ref={reg("beam")} {...A(f.beam)}>
        <rect x={-30} y={96} width={30} height={B - 96} fill={C.signal} fillOpacity={0.12} />
        <rect x={-1} y={96} width={2} height={B - 96} fill={C.signal} />
      </g>

      {/* chips */}
      <g ref={reg("chipIdle")} {...A(f.chipIdle)}>
        <g transform={`translate(0 ${n2(chipY(idleTop))})`}>
          <line x1={0} x2={0} y1={L.chipH} y2={idleTop - chipY(idleTop) - 2} stroke={C.tungsten} strokeWidth={L.sw} />
          {chipText("idle", chipW("idle", L))}
        </g>
      </g>
      <g ref={reg("chipOver")} {...A(f.chipOver)}>
        <g transform={`translate(0 ${n2(chipY(overTop))})`}>
          <line x1={0} x2={0} y1={L.chipH} y2={overTop - chipY(overTop) - 2} stroke={C.tungsten} strokeWidth={L.sw} />
          {chipText("oversized", chipW("oversized", L))}
        </g>
      </g>
      <g ref={reg("chipMisY")} {...A(f.chipMisY)}>
        <g ref={reg("chipMis")} {...A(f.chipMis)}>
          <g transform={`translate(0 ${n2(-L.chipH / 2)})`}>{chipText("mistimed", chipW("mistimed", L))}</g>
        </g>
      </g>

      {/* header strip */}
      <text x={X0} y={L.headY} className="font-mono" fontSize={fs} fontWeight={500} letterSpacing="0.14em" fill={C.paperDim}>
        CLOUD BILL · MONTHLY
      </text>
      <text
        x={X1 - redTotal - fs * 0.8}
        y={L.headY}
        className="font-mono"
        fontSize={fs}
        fontWeight={500}
        letterSpacing="0.14em"
        fill={C.paperMute}
        textAnchor="end"
      >
        TOTAL
      </text>
      <path d={redactionD(X1 - redTotal, L.headY - redH + (compact ? 1 : 0.5), 5, redW, redH, redGap)} fill={C.paperMute} />
      <rect x={BAR_X} y={L.barY} width={X1 - BAR_X} height={L.barH} fill="none" stroke={C.lineStrong} strokeWidth={L.sw} />
      <rect ref={reg("bar")} x={BAR_X} y={L.barY} width={X1 - BAR_X} height={L.barH} fill={`url(#${id}-bar)`} {...A(f.bar)} />

      {/* legend */}
      <g>
        {lg.map((it, i) => {
          const key = i === 2 ? "legendIdle" : i === 3 ? "legendOver" : i === 4 ? "legendTier" : undefined
          const sw = L.sw4
          const sy = L.legendY - fs * 0.36 - sw / 2
          const swatch =
            i === 0 ? (
              <rect x={it.sx} y={sy} width={sw} height={sw} fill={C.signalDeep} fillOpacity={0.7} />
            ) : i === 1 ? (
              <rect x={it.sx} y={sy} width={sw} height={sw} fill={C.violet} fillOpacity={0.55} />
            ) : i === 2 ? (
              <rect x={it.sx} y={sy} width={sw} height={sw} fill={`url(#${id}-hatch)`} stroke={C.tungsten} strokeWidth={L.sw * 0.5} />
            ) : i === 3 ? (
              <rect
                x={it.sx + 0.5}
                y={sy + 0.5}
                width={sw - 1}
                height={sw - 1}
                fill="none"
                stroke={C.tungsten}
                strokeWidth={L.sw}
                strokeDasharray={compact ? "3 2" : "2 1.5"}
              />
            ) : (
              <rect x={it.sx} y={L.legendY - fs * 0.36 - (compact ? 3 : 2)} width={sw} height={compact ? 6 : 4} fill={C.signalDeep} />
            )
          return (
            <g key={it.word} ref={key ? reg(key) : undefined} {...A(key ? f[key] : undefined)}>
              {swatch}
              <text x={it.tx} y={L.legendY} className="font-mono" fontSize={fs} fontWeight={500} fill={C.paperDim}>
                {it.word}
              </text>
            </g>
          )
        })}
        <line
          ref={reg("strikeIdle")}
          x1={lg[2].tx - 2}
          x2={lg[2].tx + lg[2].w + 2}
          y1={L.legendY - fs * 0.34}
          y2={L.legendY - fs * 0.34}
          stroke={C.signal}
          strokeWidth={L.sw * 1.5}
          {...A(f.strikeIdle)}
        />
        <line
          ref={reg("strikeOver")}
          x1={lg[3].tx - 2}
          x2={lg[3].tx + lg[3].w + 2}
          y1={L.legendY - fs * 0.34}
          y2={L.legendY - fs * 0.34}
          stroke={C.signal}
          strokeWidth={L.sw * 1.5}
          {...A(f.strikeOver)}
        />
      </g>

      {/* RIGHTSIZED stamp */}
      <g ref={reg("stamp")} {...A(f.stamp)}>
        <rect
          x={-stampW / 2}
          y={-stampH / 2}
          width={stampW}
          height={stampH}
          rx={compact ? 4 : 2}
          fill={C.ink900}
          fillOpacity={0.85}
          stroke={C.signal}
          strokeWidth={compact ? 3 : 2}
        />
        <text
          x={0}
          y={L.stampFs * 0.36}
          className="font-mono"
          fontSize={L.stampFs}
          fontWeight={600}
          letterSpacing="0.14em"
          fill={C.signal}
          textAnchor="middle"
        >
          RIGHTSIZED
        </text>
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------------------------------ */
/* Module                                                                                      */
/* ------------------------------------------------------------------------------------------ */

export const costScene: SceneModule = {
  id: "cost",
  label: "COST",
  beats: ["spend audit", "rightsizing", "storage tiering", "commitment planning"],
  beatAt: (v) => (v < 0.25 ? 0 : v < 0.55 ? 1 : v < 0.75 ? 2 : 3),
  keyShape: (v) => silhouette(tops(v)),
  resolve: (v) => smoothstep(0.3, 0.85, v),
  smooth: false,
  ariaLabel: "Illustration: a cloud bill shrinking as idle and oversized resources are removed",
  Furniture,
}
