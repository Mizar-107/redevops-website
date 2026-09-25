/**
 * 03 DELIVERY: "The Green Run".
 * A five-stage pipeline laid out as a film strip. The throughline is the track: wobbly, with a
 * retry loop knotted around the flaky `test` stage. The loop unties, the track straightens, a packet
 * runs the strip and every stage it passes turns green, `deploy` blooms and SHIPPED drops.
 * Pure function of v (seed 37). The ONLY time-based element is the ambient packet flow once shipped.
 */
import { useEffect, useRef, useState } from "react"
import { ease, fract, lerp, mixHex, mixPts, mulberry32, noise1D, seg, smoothstep, type Pt } from "@/lib/motion/math"
import type { SceneModule, SceneProps } from "@/lib/reel/scene"
import { useRafWhenVisible } from "@/hooks/use-raf-when-visible"
import { A, C, CHECK_D, labelSize, monoW, n2, rectD, retryD, tr, useSceneDriver, type SceneFrame } from "./shared"

/* ------------------------------------------------------------------------------------------ */
/* Track                                                                                       */
/* ------------------------------------------------------------------------------------------ */

const Y = 250
const STAGES = ["commit", "build", "test", "scan", "deploy"] as const
const PX = [120, 260, 400, 540, 680] as const
const PILL = { w: 96, h: 36, r: 18 }
const TEST = 2
const LOOP = { cx: 400, cy: 210, r: 28 }
const wob = noise1D(37, 32)
const wobY = (x: number) => Y + 22 * wob((x / 800) * 6)

const NL = 36
const NLOOP = 24
const NR = 36
const LX = [40, 372] as const
const RX = [428, 760] as const

/** Before: wobble + a retry loop around `test` (x runs backwards inside the loop; documented). */
const BEFORE: Pt[] = (() => {
  const pts: Pt[] = []
  for (let i = 0; i < NL; i++) {
    const x = lerp(LX[0], LX[1], i / (NL - 1))
    pts.push({ x, y: wobY(x) })
  }
  for (let j = 0; j < NLOOP; j++) {
    const s = (j + 0.5) / NLOOP
    const th = Math.PI / 2 - 2 * Math.PI * s
    pts.push({ x: LOOP.cx + LOOP.r * Math.cos(th) + (s - 0.5) * 28, y: LOOP.cy + LOOP.r * Math.sin(th) })
  }
  for (let i = 0; i < NR; i++) {
    const x = lerp(RX[0], RX[1], i / (NR - 1))
    pts.push({ x, y: wobY(x) })
  }
  return pts
})()

/** After: the same 96 indices, all on the straight track. */
const AFTER: Pt[] = (() => {
  const pts: Pt[] = []
  for (let i = 0; i < NL; i++) pts.push({ x: lerp(LX[0], LX[1], i / (NL - 1)), y: Y })
  for (let j = 0; j < NLOOP; j++) pts.push({ x: lerp(LX[1], RX[0], (j + 1) / (NLOOP + 1)), y: Y })
  for (let i = 0; i < NR; i++) pts.push({ x: lerp(RX[0], RX[1], i / (NR - 1)), y: Y })
  return pts
})()

const straight = (v: number) => smoothstep(0.3, 0.6, v)
const keyShape = (v: number) => mixPts(BEFORE, AFTER, straight(v))

/* Release cadence strip: irregular (bunched, two failed) → evenly spaced. Seeded. */
const CAD = (() => {
  const r = mulberry32(37)
  const n = 12
  const gaps = Array.from({ length: n }, () => 0.15 + r() * r() * 3)
  const sum = gaps.reduce((a, b) => a + b, 0)
  let acc = 0
  const before = gaps.map((gp) => {
    acc += gp
    return 72 + ((acc - gaps[0]) / (sum - gaps[0])) * 656
  })
  const after = Array.from({ length: n }, (_, k) => 72 + (k * 656) / (n - 1))
  const h = Array.from({ length: n }, () => 8 + r() * 16)
  return { n, before, after, h, failed: [3, 8] as const }
})()
const CAD_Y = 420

/* ------------------------------------------------------------------------------------------ */
/* Furniture                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const PACKET = { v0: 0.5, v1: 0.85, x0: 60, x1: 740 }
const packetX = (v: number) => lerp(PACKET.x0, PACKET.x1, seg(v, PACKET.v0, PACKET.v1))
const passV = (x: number) => PACKET.v0 + (PACKET.v1 - PACKET.v0) * ((x - PACKET.x0) / (PACKET.x1 - PACKET.x0))

type Layout = { fs: number; sw: number; labelY: number; badge: number; dot: number; tagH: number; tagPad: number }
const LAYOUT = (compact: boolean): Layout =>
  compact
    ? { fs: 22, sw: 2, labelY: 326, badge: 13, dot: 6, tagH: 32, tagPad: 10 }
    : { fs: 11, sw: 1, labelY: 312, badge: 9, dot: 3, tagH: 18, tagPad: 7 }

const SLATE_Y = (compact: boolean) => (compact ? 150 : 170)

function frameAt(v: number, compact: boolean): SceneFrame {
  const f: SceneFrame = {}
  // flaky test stage
  const flick = v < 0.35 ? (Math.floor(v * 60) % 3 === 0 ? 0.4 : 1) : 1
  const settle = seg(v, 0.35, 0.55)
  const flakyStroke = mixHex(C.tungsten, C.lineStrong, settle)
  f.flakyOn = { opacity: n2(1 - settle) }
  f.retryGlyph = {
    transform: `translate(${LOOP.cx} ${LOOP.cy}) rotate(${n2(v * 720)})`,
    opacity: n2(1 - seg(v, 0.3, 0.45)),
  }
  // stages turn green as the packet passes
  PX.forEach((px, i) => {
    const pv = passV(px)
    const c = seg(v, pv, pv + 0.03)
    const base = i === TEST ? flakyStroke : C.lineStrong
    f[`pill${i}`] = {
      stroke: c > 0 ? mixHex(base, C.go, c) : base,
      strokeOpacity: i === TEST && v < 0.35 ? flick : 1,
    }
    f[`badge${i}`] = { opacity: n2(Math.min(1, c * 3)) }
    f[`check${i}`] = { strokeDashoffset: n2(1 - c) }
    f[`label${i}`] = { fill: c > 0 ? mixHex(C.paperMute, C.paperDim, c) : C.paperMute }
  })
  // packet
  const px = packetX(v)
  const py = lerp(wobY(px), Y, straight(v))
  const pOn = seg(v, PACKET.v0, PACKET.v0 + 0.02) * (1 - seg(v, PACKET.v1, PACKET.v1 + 0.03))
  f.packet = { transform: tr(px, py), opacity: n2(pOn) }
  // deploy bloom + SHIPPED
  // cadence: ticks slide into an even rhythm while the run goes green
  let dT = ""
  let dX = ""
  const cs = compact ? 1.4 : 1
  for (let k = 0; k < CAD.n; k++) {
    const t = ease.cut(seg(v, 0.5 + k * 0.02, 0.7 + k * 0.02))
    const x = lerp(CAD.before[k], CAD.after[k], t)
    const h = lerp(CAD.h[k], 14, t) * cs
    dT += `M${n2(x)} ${CAD_Y}v${n2(-h)}`
    if ((CAD.failed as readonly number[]).includes(k)) {
      const a = 4 * cs
      const cy = CAD_Y - h - 8 * cs
      dX += `M${n2(x - a)} ${n2(cy - a)}l${n2(2 * a)} ${n2(2 * a)}M${n2(x + a)} ${n2(cy - a)}l${n2(-2 * a)} ${n2(2 * a)}`
    }
  }
  f.cadTicks = { d: dT, stroke: mixHex(C.tungsten, C.signal, seg(v, 0.6, 0.9)) }
  f.cadFail = { d: dX || "M0 0", opacity: n2(1 - seg(v, 0.38, 0.5)) }
  const bloom = seg(v, 0.85, 0.95)
  f.bloom = { opacity: n2(0.07 * seg(v, 0.85, 0.9)) }
  f.ring = { r: n2(lerp(PILL.w / 2 + 4, 110, ease.title(bloom))), opacity: n2(0.6 * (1 - bloom) * (bloom > 0 ? 1 : 0)) }
  const drop = ease.clap(seg(v, 0.88, 0.95))
  f.slate = { transform: tr(PX[4], SLATE_Y(compact) - 24 * (1 - drop)), opacity: n2(seg(v, 0.88, 0.9)) }
  return f
}

/** Ambient flow after the ship: 3 dots, period 2.4s, drift easing, the one time-based element. */
const AMBIENT_MS = 2400

function Furniture({ progress, mode, active, compact = false }: SceneProps) {
  const { f, reg } = useSceneDriver(progress, mode, (v) => frameAt(v, compact), [compact])
  const L = LAYOUT(compact)
  const fs = labelSize(compact)
  const svgRef = useRef<SVGSVGElement>(null)
  const dots = useRef<(SVGGElement | null)[]>([])

  // Discrete boundary: ambient flow may run only once v ≥ .92 (one React render per crossing).
  const eligible = mode !== "static" && active
  const [shipped, setShipped] = useState(false)
  useEffect(() => {
    if (!eligible) {
      setShipped(false)
      return
    }
    let last = progress.get() >= 0.92
    setShipped(last)
    return progress.on("change", (v) => {
      const on = v >= 0.92
      if (on !== last) {
        last = on
        setShipped(on)
      }
    })
  }, [eligible, progress])

  useRafWhenVisible(
    svgRef,
    (t) => {
      const fade = seg(progress.get(), 0.92, 0.97)
      dots.current.forEach((el, k) => {
        if (!el) return
        const ph = fract(t / AMBIENT_MS + k / 3)
        const x = lerp(40, 760, ease.drift(ph))
        el.setAttribute("transform", tr(x, Y))
        el.setAttribute("opacity", String(n2(fade * Math.sin(Math.PI * ph))))
      })
    },
    { enabled: shipped },
  )
  useEffect(() => {
    if (shipped) return
    dots.current.forEach((el) => el?.setAttribute("opacity", "0"))
  }, [shipped])

  const perf = (y: number) => {
    let d = ""
    for (let x = 40; x <= 754; x += 16) d += rectD(x, y, 6, 4)
    return d
  }
  const tagW = monoW("flaky", fs, 0.04) + L.tagPad * 2
  const slateW = monoW("SHIPPED", fs + (compact ? 2 : 2), 0.16) + (compact ? 36 : 22)
  const slateH = compact ? 50 : 28
  const bs = L.badge / 7

  return (
    <svg ref={svgRef} viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      {/* film strip: edges + perforations */}
      <g stroke={C.line} strokeWidth={L.sw}>
        <line x1={24} x2={776} y1={206} y2={206} />
        <line x1={24} x2={776} y1={294} y2={294} />
      </g>
      <path d={perf(214) + perf(282)} fill={C.line} />

      {/* release cadence */}
      <line x1={40} x2={760} y1={CAD_Y + 0.5} y2={CAD_Y + 0.5} stroke={C.lineStrong} strokeWidth={L.sw} />
      <path ref={reg("cadTicks")} fill="none" strokeWidth={compact ? 3 : 1.5} strokeLinecap="round" {...A(f.cadTicks)} />
      <path ref={reg("cadFail")} fill="none" stroke={C.alarm} strokeWidth={compact ? 2.5 : 1.25} strokeLinecap="round" {...A(f.cadFail)} />
      <text x={40} y={CAD_Y + (compact ? 30 : 18)} className="font-mono" fontSize={fs} fontWeight={500} letterSpacing="0.04em" fill={C.paperMute}>
        deploy
      </text>

      {/* deploy bloom */}
      <circle ref={reg("bloom")} cx={PX[4]} cy={Y} r={64} fill={C.signal} {...A(f.bloom)} />
      <circle ref={reg("ring")} cx={PX[4]} cy={Y} fill="none" stroke={C.signal} strokeWidth={L.sw} {...A(f.ring)} />

      {/* stages */}
      {STAGES.map((s, i) => (
        <g key={s}>
          <rect
            ref={reg(`pill${i}`)}
            x={PX[i] - PILL.w / 2}
            y={Y - PILL.h / 2}
            width={PILL.w}
            height={PILL.h}
            rx={PILL.r}
            fill={C.ink900}
            strokeWidth={compact ? 2.5 : 1.25}
            {...A(f[`pill${i}`])}
          />
          <text
            ref={reg(`label${i}`)}
            x={PX[i]}
            y={L.labelY}
            className="font-mono"
            fontSize={fs}
            fontWeight={500}
            letterSpacing="0.04em"
            textAnchor="middle"
            {...A(f[`label${i}`])}
          >
            {s}
          </text>
          <g ref={reg(`badge${i}`)} transform={tr(PX[i] + PILL.w / 2 - 6, Y - PILL.h / 2 - 2)} {...A(f[`badge${i}`])}>
            <circle r={L.badge} fill={C.ink900} stroke={C.go} strokeWidth={L.sw} />
            <path
              ref={reg(`check${i}`)}
              d={CHECK_D}
              transform={`scale(${n2(bs)})`}
              fill="none"
              stroke={C.go}
              strokeWidth={(compact ? 2.6 : 1.5) / bs}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              {...A(f[`check${i}`])}
            />
          </g>
        </g>
      ))}

      {/* flaky: tag + retry */}
      <g ref={reg("flakyOn")} {...A(f.flakyOn)}>
        <rect
          x={LOOP.cx + LOOP.r + 12}
          y={LOOP.cy - LOOP.r - (compact ? 14 : 6)}
          width={tagW}
          height={L.tagH}
          rx={compact ? 5 : 3}
          fill={C.ink850}
          stroke={C.tungsten}
          strokeWidth={L.sw}
        />
        <text
          x={LOOP.cx + LOOP.r + 12 + tagW / 2}
          y={LOOP.cy - LOOP.r - (compact ? 14 : 6) + L.tagH / 2 + fs * 0.36}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          fill={C.tungsten}
          textAnchor="middle"
        >
          flaky
        </text>
        <text
          x={LOOP.cx - LOOP.r - 10}
          y={LOOP.cy - (compact ? 6 : 10)}
          className="font-mono"
          fontSize={fs}
          fontWeight={500}
          letterSpacing="0.04em"
          fill={C.tungsten}
          textAnchor="end"
        >
          retry
        </text>
      </g>
      <path
        ref={reg("retryGlyph")}
        d={retryD(compact ? 12 : 8)}
        fill="none"
        stroke={C.tungsten}
        strokeWidth={compact ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...A(f.retryGlyph)}
      />

      {/* the run packet */}
      <g ref={reg("packet")} {...A(f.packet)}>
        <circle r={L.dot * 5} fill={C.signal} fillOpacity={0.06} />
        <circle r={L.dot * 2.6} fill={C.signal} fillOpacity={0.14} />
        <circle r={L.dot} fill={C.signalHot} />
      </g>

      {/* ambient cadence (time-based; hidden until shipped) */}
      {[0, 1, 2].map((k) => (
        <g
          key={k}
          ref={(el) => {
            dots.current[k] = el
          }}
          opacity={0}
          transform={tr(40, Y)}
        >
          <circle r={L.dot * 2.4} fill={C.signal} fillOpacity={0.14} />
          <circle r={L.dot * 0.9} fill={C.signalHot} />
        </g>
      ))}

      {/* SHIPPED slate */}
      <g ref={reg("slate")} {...A(f.slate)}>
        <rect x={-slateW / 2} y={-slateH / 2} width={slateW} height={slateH} rx={compact ? 4 : 2} fill={C.ink900} stroke={C.signal} strokeWidth={compact ? 3 : 1.5} />
        <path
          d={(() => {
            // clapper stripes along the top edge
            const h = compact ? 9 : 5
            const w = compact ? 14 : 8
            let d = ""
            for (let x = -slateW / 2 + 2; x < slateW / 2 - w; x += w * 2) {
              d += `M${n2(x)} ${n2(-slateH / 2 + h)}l${n2(w * 0.6)} ${n2(-h)}h${n2(w * 0.6)}l${n2(-w * 0.6)} ${n2(h)}Z`
            }
            return d
          })()}
          fill={C.signal}
          fillOpacity={0.55}
        />
        <text
          x={0}
          y={(compact ? 9 : 5) / 2 + (fs + 2) * 0.36}
          className="font-mono"
          fontSize={fs + 2}
          fontWeight={600}
          letterSpacing="0.16em"
          fill={C.signal}
          textAnchor="middle"
        >
          SHIPPED
        </text>
      </g>
    </svg>
  )
}

export const deliveryScene: SceneModule = {
  id: "delivery",
  label: "DELIVERY",
  beats: ["flaky stages", "clear environments", "trusted cadence", "trusted cadence"],
  beatAt: (v) => (v < 0.35 ? 0 : v < 0.55 ? 1 : v < 0.85 ? 2 : 3),
  keyShape,
  resolve: (v) => smoothstep(0.35, 0.6, v),
  smooth: true,
  ariaLabel: "Illustration: a flaky pipeline stabilising and shipping on a steady cadence",
  Furniture,
}
