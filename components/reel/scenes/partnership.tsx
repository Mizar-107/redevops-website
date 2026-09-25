/**
 * 04 PARTNERSHIP: "Two Tracks".
 * ReDevOps' track (the throughline, signal) and your engineers' track (paper-dim, drawn here with the
 * same formula) run apart, braid while pairing, and merge. Three documents drop onto the merged line
 * and stay. The team line takes the signal colour and weight: the team is left stronger.
 * At v = 1 the line is flat at y 250 (=== K0), so the stage's release to K0 is invisible.
 * Pure function of v (seed 41).
 */
import { ease, lerp, mixHex, mulberry32, seg, smoothstep, pathD, type Pt } from "@/lib/motion/math"
import type { SceneModule, SceneProps } from "@/lib/reel/scene"
import { A, C, docD, labelSize, n2, tr, useSceneDriver, type SceneFrame } from "./shared"

const N = 96
const XS = Array.from({ length: N }, (_, i) => (800 * i) / (N - 1))

const sep = (v: number) => 90 * (1 - smoothstep(0.25, 0.75, v))
const braidAt = (xn: number, v: number) => 28 * Math.sin(2 * Math.PI * 3 * xn) * Math.sin(Math.PI * seg(v, 0.15, 0.85))
const yOurs = (xn: number, v: number) => 250 + sep(v) / 2 + braidAt(xn, v) / 2
const yTeam = (xn: number, v: number) => 250 - sep(v) / 2 - braidAt(xn, v) / 2

/** Team path d, cached on the two numbers that shape it (constant outside the braid window). */
let teamKey = ""
let teamCache = ""
const teamD = (v: number) => {
  // pure in the rounded key, so SSR and client agree whatever was cached before
  const sp = n2(sep(v))
  const bk = Math.round(Math.sin(Math.PI * seg(v, 0.15, 0.85)) * 1000) / 1000
  const key = `${sp}|${bk}`
  if (key !== teamKey) {
    teamKey = key
    teamCache = pathD(
      XS.map((x) => ({ x, y: 250 - sp / 2 - (28 * Math.sin(2 * Math.PI * 3 * (x / 800)) * bk) / 2 })),
      { smooth: true },
    )
  }
  return teamCache
}

const keyShape = (v: number): Pt[] => XS.map((x) => ({ x, y: yOurs(x / 800, v) }))

const DOCS = [
  { x: 270, label: "runbook.md" },
  { x: 440, label: "decisions.md" },
  { x: 610, label: "architecture diagram" },
] as const
const docWindow = (k: number) => [0.66 + 0.07 * k, 0.76 + 0.07 * k] as const

/** Pairing stitches: short connectors between the two tracks while they work side by side. */
const STITCH_X = (() => {
  const r = mulberry32(41)
  return Array.from({ length: 9 }, (_, k) => 72 + k * 82 + (r() - 0.5) * 24)
})()

/** Hand-over lanes: who carries the work, slot by slot. We carry less, your team carries more. */
const LANES = { x0: 64, slot: 56, n: 12, yTeam: 386, yOurs: 404 }
const laneD = (y: number, h: number, frac: (k: number) => number, v: number) => {
  let d = ""
  for (let k = 0; k < LANES.n; k++) {
    const a = 0.04 + k * 0.058
    const p = ease.cut(seg(v, a, a + 0.08))
    const w = (LANES.slot - 6) * frac(k) * p
    if (w > 0.2) d += `M${n2(LANES.x0 + k * LANES.slot)} ${y}h${n2(w)}v${h}h${n2(-w)}Z`
  }
  return d || "M0 0"
}
const teamFrac = (k: number) => lerp(0.22, 1, smoothstep(0, 1, k / (LANES.n - 1)))
const oursFrac = (k: number) => lerp(1, 0.14, smoothstep(0, 1, k / (LANES.n - 1)))

type Layout = { fs: number; sw: number; docW: number; docH: number; labelDy: readonly [number, number, number] }
const LAYOUT = (compact: boolean): Layout =>
  compact
    ? { fs: 22, sw: 2, docW: 24, docH: 32, labelDy: [34, 66, 34] }
    : { fs: 11, sw: 1, docW: 15, docH: 20, labelDy: [22, 22, 22] }

function frameAt(v: number, compact: boolean): SceneFrame {
  const f: SceneFrame = {}
  const strong = seg(v, 0.85, 0.95)
  f.team = {
    d: teamD(v),
    stroke: mixHex(C.paperDim, C.signal, strong),
    strokeWidth: n2(lerp(1.5, 3, strong) * (compact ? 1.6 : 1)),
  }
  // labels ride the left ends of their tracks
  // clear the braid's crest over the label span
  const crest = 14 * Math.sin(Math.PI * seg(v, 0.15, 0.85))
  f.teamLabel = { transform: tr(0, 250 - sep(v) / 2 - crest) }
  f.oursLabel = { transform: tr(0, 250 + sep(v) / 2 + crest) }
  f.teamLabelText = { fill: mixHex(C.paperDim, C.signal, strong) }

  // hand-over lanes
  const lh = compact ? 12 : 8
  f.laneTeam = { d: laneD(LANES.yTeam - lh, lh, teamFrac, v), fill: mixHex(C.paperDim, C.signal, strong * 0.6) }
  f.laneOurs = { d: laneD(LANES.yOurs - lh, lh, oursFrac, v) }

  // pairing stitches
  const on = Math.sin(Math.PI * seg(v, 0.08, 0.72))
  let d = ""
  if (on > 0.001) {
    for (const x of STITCH_X) {
      const xn = x / 800
      const a = yTeam(xn, v)
      const b = yOurs(xn, v)
      const gap = compact ? 7 : 4
      if (Math.abs(b - a) > gap * 2 + 2) {
        const s = Math.sign(b - a)
        d += `M${n2(x)} ${n2(a + s * gap)}L${n2(x)} ${n2(b - s * gap)}`
      }
    }
  }
  f.stitch = { d: d || "M0 0", opacity: n2(0.7 * on) }

  // documents drop onto the merged line and stay
  DOCS.forEach((_, k) => {
    const [a, b] = docWindow(k)
    const t = seg(v, a, b)
    const y = -40 * (1 - ease.clap(t))
    f[`doc${k}`] = { transform: tr(0, y), opacity: n2(seg(v, a, a + 0.02)) }
    f[`docLabel${k}`] = { opacity: n2(seg(v, b - 0.03, b + 0.02)) }
  })

  return f
}

function Furniture({ progress, mode, compact = false }: SceneProps) {
  const { f, reg } = useSceneDriver(progress, mode, (v) => frameAt(v, compact), [compact])
  const L = LAYOUT(compact)
  const fs = labelSize(compact)

  return (
    <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <line x1={LANES.x0} x2={LANES.x0 + LANES.n * LANES.slot} y1={LANES.yOurs + (compact ? 8 : 6)} y2={LANES.yOurs + (compact ? 8 : 6)} stroke={C.line} strokeWidth={L.sw} />
      <path ref={reg("laneTeam")} fillOpacity={0.4} {...A(f.laneTeam)} />
      <path ref={reg("laneOurs")} fill={C.signal} fillOpacity={0.55} {...A(f.laneOurs)} />
      <path ref={reg("stitch")} fill="none" stroke={C.paperMute} strokeWidth={L.sw} strokeDasharray={compact ? "3 4" : "2 2"} {...A(f.stitch)} />
      <path ref={reg("team")} fill="none" strokeLinecap="round" strokeLinejoin="round" {...A(f.team)} />

      <g ref={reg("teamLabel")} {...A(f.teamLabel)}>
        <text
          ref={reg("teamLabelText")}
          x={24}
          y={-(compact ? 14 : 10)}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          {...A(f.teamLabelText)}
        >
          your engineers
        </text>
      </g>
      <g ref={reg("oursLabel")} {...A(f.oursLabel)}>
        <text
          x={24}
          y={compact ? 30 : 19}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          fill={C.signal}
        >
          ReDevOps
        </text>
      </g>

      {DOCS.map((doc, k) => {
        const w = L.docW
        const h = L.docH
        return (
          <g key={doc.label}>
            <g ref={reg(`doc${k}`)} {...A(f[`doc${k}`])}>
              <path
                d={docD(w, h)}
                transform={tr(doc.x - w / 2, 250 - 3 - h)}
                fill={C.ink850}
                stroke={C.signal}
                strokeWidth={L.sw}
                strokeLinejoin="round"
              />
              <path
                d={`M${n2(w * 0.2)} ${n2(h * 0.5)}h${n2(w * 0.55)}M${n2(w * 0.2)} ${n2(h * 0.7)}h${n2(w * 0.45)}`}
                transform={tr(doc.x - w / 2, 250 - 3 - h)}
                stroke={C.signal}
                strokeOpacity={0.6}
                strokeWidth={L.sw}
              />
            </g>
            <text
              ref={reg(`docLabel${k}`)}
              x={doc.x}
              y={250 + L.labelDy[k]}
              className="font-mono"
              fontSize={fs}
              fontWeight={500}
              letterSpacing="0.02em"
              fill={C.paperDim}
              textAnchor="middle"
              {...A(f[`docLabel${k}`])}
            >
              {doc.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const partnershipScene: SceneModule = {
  id: "partnership",
  label: "PARTNERSHIP",
  beats: ["pair on real systems", "document decisions", "leave the team stronger", "leave the team stronger"],
  beatAt: (v) => (v < 0.6 ? 0 : v < 0.85 ? 1 : v < 0.92 ? 2 : 3),
  keyShape,
  resolve: () => 1,
  smooth: true,
  ariaLabel: "Illustration: your team's track and ReDevOps' track merging, leaving documentation behind",
  Furniture,
}


