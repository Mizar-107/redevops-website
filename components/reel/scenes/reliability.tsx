/**
 * 02 RELIABILITY: "Signal from Noise".
 * The throughline is a live telemetry trace: noisy, spiking through the page threshold, while five
 * pages pile up. An SLO band forms, the spikes and the noise drain away, the pages fold into one
 * actionable alert with a runbook, and a controlled incident bump is handled while its checklist
 * ticks. The trace ends as a calm heartbeat. Pure function of v, seeded with mulberry32(23).
 */
import { ease, fbm1D, fract, lerp, mixHex, mulberry32, seg, smoothstep, type Pt } from "@/lib/motion/math"
import type { SceneModule, SceneProps } from "@/lib/reel/scene"
import {
  A,
  C,
  CHECK_D,
  labelSize,
  n2,
  redactionLineD,
  retryD,
  scaleAt,
  tr,
  useSceneDriver,
  type SceneFrame,
} from "./shared"

/* ------------------------------------------------------------------------------------------ */
/* Seeded signal                                                                               */
/* ------------------------------------------------------------------------------------------ */

const SEED = 23
const noise = fbm1D(SEED, 3, 64)
const THRESH_Y = 150
const BAND = { top: 215, bottom: 285 }

const SPIKES = (() => {
  const r = mulberry32(SEED)
  return Array.from({ length: 6 }, (_, k) => ({
    x: 0.26 + k * (0.23 / 5) + (r() - 0.5) * 0.024,
    s: 110 + r() * 60,
  }))
})()
const R_T = 0.34
const PULSES = 5

/** P-QRS-T template on t ∈ [0, 1). Positive = up. */
const g = (t: number, mu: number, sig: number) => Math.exp(-(((t - mu) / sig) ** 2))
const pulse = (t: number) =>
  0.12 * g(t, 0.12, 0.035) - 0.1 * g(t, 0.3, 0.012) + g(t, R_T, 0.012) - 0.25 * g(t, 0.38, 0.014) + 0.28 * g(t, 0.58, 0.05)

/**
 * Sample grid (fixed, x ascending): 53 uniform points plus extra points on every QRS complex and
 * every spike so the sharp features are never aliased away. Exactly 96.
 */
const XS: number[] = (() => {
  const xs: number[] = []
  for (let i = 0; i < 53; i++) xs.push((800 * i) / 52)
  for (let j = 0; j < PULSES; j++) {
    const xr = ((j + R_T) / PULSES) * 800
    for (const o of [-6.4, -2.4, 0, 2.4, 6.4]) xs.push(xr + o)
  }
  for (const s of SPIKES) for (const o of [-4, 0, 4]) xs.push(s.x * 800 + o)
  return xs.sort((a, b) => a - b)
})()

function traceY(xn: number, v: number) {
  const amp = lerp(40, 4, smoothstep(0.3, 0.6, v))
  let y = 250 + amp * noise(xn * 9 + v * 4)
  const spikeK = 1 - smoothstep(0.35, 0.6, v)
  if (spikeK > 0) {
    for (const s of SPIKES) y -= spikeK * s.s * Math.exp(-(((xn - s.x) / 0.012) ** 2))
  }
  y -= smoothstep(0.45, 0.8, v) * 30 * pulse(fract(xn * PULSES))
  y -= 40 * Math.sin(Math.PI * seg(v, 0.68, 0.9)) * Math.exp(-(((xn - 0.6) / 0.04) ** 2))
  return y
}

function keyShape(v: number): Pt[] {
  return XS.map((x) => ({ x, y: traceY(x / 800, v) }))
}

/* ------------------------------------------------------------------------------------------ */
/* Furniture                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const CHIPS = ["cpu high", "pod restart", "flapping check", "latency", "retry storm"] as const
const RUN_W = [
  [34, 58, 22],
  [48, 30, 40],
  [26, 64],
] as const

type Layout = { fs: number; sw: number; x: number; w: number; h: number; y0: number; dy: number; rowH: number; pad: number; box: number }
const LAYOUT = (compact: boolean): Layout =>
  compact
    ? { fs: 22, sw: 2, x: 348, w: 436, h: 40, y0: 296, dy: 34, rowH: 32, pad: 14, box: 16 }
    : { fs: 11, sw: 1, x: 536, w: 240, h: 22, y0: 318, dy: 30, rowH: 19, pad: 9, box: 9 }

const chipAt = (k: number) => 0.04 + k * 0.05

function frameAt(v: number, compact: boolean): SceneFrame {
  const L = LAYOUT(compact)
  const f: SceneFrame = {}
  const calm = seg(v, 0.35, 0.55)
  const merge = ease.cut(seg(v, 0.55, 0.65))
  const fadeOthers = 1 - seg(v, 0.59, 0.64)
  for (let k = 0; k < 5; k++) {
    const a = chipAt(k)
    const o = seg(v, a, a + 0.02)
    const drop = -8 * (1 - ease.title(seg(v, a, a + 0.035)))
    const jit = (compact ? 3 : 2) * Math.sin(v * 400 + k) * (1 - calm)
    const y = lerp(L.y0 + k * L.dy, L.y0, merge) + drop
    f[`chip${k}`] = { transform: tr(L.x + jit, y), opacity: n2(k === 4 ? o : o * fadeOthers) }
  }
  const x = seg(v, 0.64, 0.7)
  f.chip4Rect = { stroke: mixHex(C.alarm, C.signal, x) }
  f.chip4Dot = { fill: mixHex(C.alarm, C.signal, x) }
  f.chip4Old = { opacity: n2(1 - seg(v, 0.64, 0.665)) }
  f.chip4New = { opacity: n2(seg(v, 0.67, 0.7)) }
  f.retry = {
    transform: `translate(${n2(L.w - (compact ? 14 : L.h / 2))} ${n2(L.h / 2)}) rotate(${n2(360 * seg(v, 0.7, 0.9))})`,
    opacity: n2(seg(v, 0.67, 0.7)),
  }

  // runbook card unfolds from the actionable alert
  const unfold = ease.cut(seg(v, 0.7, 0.78))
  const cardH = L.h + 3 * L.rowH + L.pad
  f.card = { transform: scaleAt(1, unfold, 0, 0), opacity: n2(unfold > 0 ? 1 : 0), height: n2(cardH) }
  for (let k = 0; k < 3; k++) {
    const ro = seg(v, 0.73 + 0.025 * k, 0.76 + 0.025 * k)
    f[`row${k}`] = { opacity: n2(ro), transform: tr(0, (1 - ease.title(ro)) * 4) }
    const tick = seg(v, 0.78 + 0.035 * k, 0.81 + 0.035 * k)
    f[`tick${k}`] = { strokeDashoffset: n2(1 - tick) }
    f[`box${k}`] = { stroke: mixHex(C.paperMute, C.signal, tick) }
  }

  // SLO band grows from its centre
  const band = ease.cut(seg(v, 0.35, 0.55))
  f.band = { transform: scaleAt(1, Math.max(band, 0.0001), 0, 250), opacity: n2(band > 0 ? 1 : 0) }
  f.bandLabel = { opacity: n2(band) }
  // page threshold quiets once nothing crosses it
  f.thresh = { opacity: n2(lerp(1, 0.45, seg(v, 0.45, 0.65))) }
  return f
}

function Furniture({ progress, mode, compact = false }: SceneProps) {
  const { f, reg } = useSceneDriver(progress, mode, (v) => frameAt(v, compact), [compact])
  const L = LAYOUT(compact)
  const fs = labelSize(compact)
  const tx = L.h * 0.9 + (compact ? 4 : 1)
  const ty = L.h / 2 + fs * 0.36
  const dotR = compact ? 5 : 3
  const chipText = (label: string) => (
    <>
      <tspan fill={C.alarm}>PAGE</tspan>
      <tspan fill={C.paperDim}>{` · ${label}`}</tspan>
    </>
  )
  const rx = compact ? 8 : 4

  return (
    <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      {/* SLO band */}
      <g ref={reg("band")} {...A(f.band)}>
        <rect x={0} y={BAND.top} width={800} height={BAND.bottom - BAND.top} fill={C.signal} fillOpacity={0.06} />
        <g stroke={C.signal} strokeOpacity={0.5} strokeWidth={L.sw} strokeDasharray={compact ? "8 6" : "4 4"}>
          <line x1={0} x2={800} y1={BAND.top} y2={BAND.top} />
          <line x1={0} x2={800} y1={BAND.bottom} y2={BAND.bottom} />
        </g>
      </g>
      <text
        ref={reg("bandLabel")}
        x={16}
        y={BAND.top - (compact ? 8 : 6)}
        className="font-mono"
        fontSize={fs}
        fontWeight={500}
        letterSpacing="0.04em"
        fill={C.signal}
        {...A(f.bandLabel)}
      >
        SLO band
      </text>

      {/* page threshold */}
      <g ref={reg("thresh")} {...A(f.thresh)}>
        <line
          x1={0}
          x2={800}
          y1={THRESH_Y}
          y2={THRESH_Y}
          stroke={C.tungsten}
          strokeWidth={L.sw}
          strokeDasharray={compact ? "10 7" : "6 4"}
        />
        <text
          x={16}
          y={THRESH_Y - (compact ? 8 : 6)}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          fill={C.tungsten}
        >
          page threshold
        </text>
      </g>

      {/* the page pile; chip 4 survives as the actionable alert */}
      {CHIPS.map((label, k) => (
        <g key={label} ref={reg(`chip${k}`)} {...A(f[`chip${k}`])}>
          {k === 4 ? (
            <>
              <rect
                ref={reg("card")}
                x={0}
                y={0}
                width={L.w}
                rx={rx}
                fill={C.ink850}
                stroke={C.signal}
                strokeOpacity={0.35}
                strokeWidth={L.sw}
                {...A(f.card)}
              />
              {RUN_W.map((ws, r) => {
                const ry = L.h + L.pad * 0.6 + r * L.rowH
                const bx = compact ? 18 : 12
                const cy = ry + L.rowH / 2
                const s = L.box / 10
                return (
                  <g key={r} ref={reg(`row${r}`)} {...A(f[`row${r}`])}>
                    <rect
                      ref={reg(`box${r}`)}
                      x={bx - L.box / 2}
                      y={cy - L.box / 2}
                      width={L.box}
                      height={L.box}
                      rx={compact ? 3 : 1.5}
                      fill="none"
                      strokeWidth={L.sw}
                      {...A(f[`box${r}`])}
                    />
                    <path
                      ref={reg(`tick${r}`)}
                      d={CHECK_D}
                      transform={`translate(${bx} ${n2(cy)}) scale(${n2(s * 0.85)})`}
                      fill="none"
                      stroke={C.signal}
                      strokeWidth={(compact ? 3 : 1.6) / (s * 0.85)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1 1"
                      {...A(f[`tick${r}`])}
                    />
                    <path
                      d={redactionLineD(
                        bx + L.box + (compact ? 12 : 8),
                        cy - (compact ? 5 : 2.5),
                        ws.map((w) => w * (compact ? 2 : 1)),
                        compact ? 10 : 5,
                        compact ? 8 : 4,
                      )}
                      fill={C.paperMute}
                      fillOpacity={0.7}
                    />
                  </g>
                )
              })}
            </>
          ) : null}
          <rect
            ref={k === 4 ? reg("chip4Rect") : undefined}
            x={0}
            y={0}
            width={L.w}
            height={L.h}
            rx={rx}
            fill={C.ink850}
            stroke={C.alarm}
            strokeWidth={L.sw}
            {...A(k === 4 ? f.chip4Rect : undefined)}
          />
          <circle
            ref={k === 4 ? reg("chip4Dot") : undefined}
            cx={L.h / 2 + (compact ? 2 : 0)}
            cy={L.h / 2}
            r={dotR}
            fill={C.alarm}
            {...A(k === 4 ? f.chip4Dot : undefined)}
          />
          <text
            ref={k === 4 ? reg("chip4Old") : undefined}
            x={tx}
            y={ty}
            className="font-mono"
            fontSize={fs}
            fontWeight={500}
            letterSpacing={compact ? "0em" : "0.02em"}
            {...A(k === 4 ? f.chip4Old : undefined)}
          >
            {chipText(label)}
          </text>
          {k === 4 ? (
            <>
              <text
                ref={reg("chip4New")}
                x={tx}
                y={ty}
                className="font-mono"
                fontSize={fs}
                fontWeight={500}
                letterSpacing={compact ? "0em" : "0.02em"}
                {...A(f.chip4New)}
              >
                <tspan fill={C.signal}>ACTIONABLE</tspan>
                <tspan fill={C.paperDim}> · runbook linked</tspan>
              </text>
              <path
                ref={reg("retry")}
                d={retryD(compact ? 7.5 : 5)}
                fill="none"
                stroke={C.signal}
                strokeWidth={L.sw * 1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...A(f.retry)}
              />
            </>
          ) : null}
        </g>
      ))}
    </svg>
  )
}

export const reliabilityScene: SceneModule = {
  id: "reliability",
  label: "RELIABILITY",
  beats: ["monitoring", "alerting", "runbooks", "incident practice"],
  beatAt: (v) => (v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.7 ? 2 : 3),
  keyShape,
  resolve: (v) => smoothstep(0.35, 0.75, v),
  smooth: true,
  ariaLabel: "Illustration: noisy alerts settling into one actionable alert with a runbook",
  Furniture,
}
