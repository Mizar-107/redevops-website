import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { fms } from "@/lib/motion/tokens"
import s from "./intermission.module.css"

/* Geometry (SVG user units, viewBox 0 0 160 160). */
const C = 80
const N = 60
const R = { ring: 77, tickOut: 72, minorIn: 68, majorIn: 63, wedge: 62, hand: 63, hub: 27 } as const

const r2 = (v: number) => Math.round(v * 100) / 100
const polar = (k: number, r: number) => {
  const a = (k / N) * Math.PI * 2
  return { x: r2(C + Math.sin(a) * r), y: r2(C - Math.cos(a) * r) }
}

const TICKS = Array.from({ length: N }, (_, k) => {
  const major = k % 5 === 0
  const a = polar(k, major ? R.majorIn : R.minorIn)
  const b = polar(k, R.tickOut)
  return { k, major, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
})

/** All 60 unlit ticks as one path (the lit copies are individual lines so each can light on its own frame). */
const TICKS_D = TICKS.map((t) => `M${t.x1} ${t.y1}L${t.x2} ${t.y2}`).join("")

/** The 12 o'clock cap: the tick plus a playhead head sitting on the bezel (the hand-off to the Process playhead). */
const CAP_TICK = { x1: C, y1: C - R.majorIn, x2: C, y2: C - R.tickOut }
const CAP_HEAD = "M74.5 0.5H85.5L80 7.5Z"

export type DialProps = {
  className?: string
  /** ms from the dial's own reveal to the start of the sweep (default f12: the H2 is ~70% landed) */
  delay?: number
}

/**
 * The 30-minute dial (Intermission). Server-safe, CSS only, aria-hidden.
 *
 * On reveal (data-reveal="custom"): after `delay`, a signal wedge (pie trick: r = R/2, stroke-width = R,
 * pathLength = 1) sweeps strokeDashoffset 1 → 0 once, linear over f36, from 12 o'clock. The hand (the
 * throughline, with the §4.2 double-stroke glow) rides the wedge's leading edge and each of the 59 ticks
 * lights on the frame the hand passes it. At f36 the 12 o'clock tick pops (spring-clap) with a playhead
 * head: the dial now reads as the Process playhead that follows.
 *
 * SSR / no-JS / reduced motion / already-in-view all render the final frame: full wedge, lit ticks,
 * hand parked at 12, cap up.
 */
export function Dial({ className, delay = fms(12) }: DialProps) {
  return (
    <div
      aria-hidden="true"
      data-reveal="custom"
      className={cn(s.dial, className)}
      style={{ "--dial-d": `${delay}ms` } as CSSProperties}
    >
      <svg viewBox="0 0 160 160" className={s.dialSvg} focusable="false">
        <circle cx={C} cy={C} r={R.ring} className={s.bezel} />
        <circle
          cx={C}
          cy={C}
          r={R.wedge / 2}
          strokeWidth={R.wedge}
          pathLength={1}
          transform={`rotate(-90 ${C} ${C})`}
          className={s.wedge}
        />
        <path d={TICKS_D} className={s.ticks} />
        <g className={s.litTicks}>
          {TICKS.slice(1).map((t) => (
            <line
              key={t.k}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={t.major ? s.litMajor : s.litMinor}
              style={{ "--k": t.k } as CSSProperties}
            />
          ))}
        </g>
        <g className={s.hand}>
          <line x1={C} y1={C} x2={C} y2={C - R.hand} className={s.handHalo} />
          <line x1={C} y1={C} x2={C} y2={C - R.hand} className={s.handCore} />
        </g>
        <circle cx={C} cy={C} r={R.hub} className={s.hub} />
        <g className={s.cap}>
          <line {...CAP_TICK} className={s.capTick} />
          <path d={CAP_HEAD} className={s.capHead} />
        </g>
      </svg>
      <span className={s.dialLabel}>
        <span className={s.dialText}>30 MIN</span>
      </span>
    </div>
  )
}
