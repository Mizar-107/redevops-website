"use client"

import { useEffect, useId, useImperativeHandle, useRef, type CSSProperties, type Ref } from "react"
import { cn } from "@/lib/utils"
import { clamp, mulberry32 } from "@/lib/motion/math"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { RULER_MAJORS, STEPS, jumpLabel, pad2, tcAt, type StepIndex } from "./process-data"
import styles from "./process.module.css"

/* ------------------------------------------------------------------ A1 waveform (pure, seeded) */

const BARS = 96
const WAVE_W = 960
const WAVE_H = 36

/** 96 seeded bar amplitudes in 0..1 (mulberry32(7)), shaped like speech: phrases and pauses. */
export const WAVE: readonly number[] = (() => {
  const r = mulberry32(7)
  return Array.from({ length: BARS }, (_, i) => {
    const x = i / (BARS - 1)
    // phrases (a slow envelope) with short pauses between them, and per-bar syllable jitter
    const env =
      Math.abs(Math.sin(x * Math.PI * 9.5 + 0.4)) ** 0.5 * (0.62 + 0.38 * Math.sin(x * Math.PI * 3.1 + 0.9))
    const v = r()
    return clamp(0.06 + env * (0.25 + 0.75 * v), 0.06, 1)
  })
})()

/** Programme level at playhead p (0..1), for the audio meters. Pure. */
export const levelAt = (p: number, channel: 0 | 1 = 0) => {
  const i = Math.min(BARS - 1, Math.floor(clamp(p) * BARS) + channel)
  return WAVE[i] * (channel ? 0.92 : 1)
}

const r1 = (v: number) => Math.round(v * 10) / 10
const WAVE_D = WAVE.map((a, i) => {
  const pitch = WAVE_W / BARS
  const x = i * pitch + 2.5
  const h = Math.max(0.75, a * (WAVE_H / 2 - 2))
  return `M${r1(x)} ${r1(WAVE_H / 2 - h)}h5v${r1(h * 2)}h-5z`
}).join("")

/* ------------------------------------------------------------------ ruler (pure) */

const MINOR_D = Array.from({ length: 101 }, (_, i) => (i % 10 === 0 ? "" : `M${i * 10} 24V30`)).join("")
const MAJOR_D = Array.from({ length: RULER_MAJORS + 1 }, (_, i) => `M${i * 100} 16V30`).join("")
const MAJORS = Array.from({ length: RULER_MAJORS + 1 }, (_, i) => i / RULER_MAJORS)

/* Overlaps between consecutive clips = the cross-dissolves. */
const DISSOLVES = STEPS.slice(1).map((s, k) => [s.clip[0], STEPS[k].clip[1]] as const)

/* ------------------------------------------------------------------ component */

export type TimelineHandle = {
  /** Scroll-linked write: playhead, played waveform. Never renders. */
  update(p: number): void
}

type TimelineProps = {
  step: StepIndex
  end: boolean
  onJump(i: number): void
  handleRef?: Ref<TimelineHandle>
  /** the current-timecode readout in the ruler header (written by the stage) */
  tcRef?: Ref<HTMLSpanElement>
}

function Dissolve({ from, to, clip, side }: { from: number; to: number; clip: readonly [number, number]; side: "in" | "out" }) {
  const span = clip[1] - clip[0]
  const style = {
    "--x0": ((from - clip[0]) / span).toFixed(4),
    "--xw": ((to - from) / span).toFixed(4),
  } as CSSProperties
  return (
    <svg
      aria-hidden="true"
      className={cn(styles.dissolve, side === "in" ? styles.dissolveIn : styles.dissolveOut)}
      style={style}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path d="M0 0L100 100M0 100L100 0" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * The NLE timeline (bottom of the pinned stage): marker row, TC ruler, three video tracks with one
 * clip each (the clips are the only interactive/accessible part), the A1 waveform of "your team",
 * and the playhead: the throughline, standing upright.
 */
export function Timeline({ step, end, onJump, handleRef, tcRef }: TimelineProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const playedRef = useRef<SVGRectElement>(null)
  const width = useRef(0)
  const last = useRef({ x: "", s: "" })
  const lastP = useRef(0)
  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, "")

  const write = (p: number) => {
    lastP.current = p
    const x = (clamp(p) * width.current).toFixed(1)
    if (x !== last.current.x) {
      last.current.x = x
      if (headRef.current) headRef.current.style.transform = `translate3d(${x}px,0,0)`
    }
    const s = clamp(p).toFixed(4)
    if (s !== last.current.s) {
      last.current.s = s
      playedRef.current?.setAttribute("transform", `scale(${s} 1)`)
    }
  }

  useImperativeHandle(handleRef, () => ({ update: write }))

  // Cache the track width (the playhead moves in px via transform, never via layout).
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      width.current = el.clientWidth
      last.current.x = ""
      write(lastP.current)
    })
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // DOM (and tab) order is step order V1 → V3; CSS `order` stacks V3 on top, like an NLE.
  const laneOrder = (i: number) => ({ order: 2 + (STEPS.length - 1 - i) })

  return (
    <div className={styles.timeline} data-reveal="custom" data-end={end ? "" : undefined}>
      <div className={cn("shell", styles.tlGrid)}>
        {/* track headers */}
        <div className={styles.tlHeads} aria-hidden="true">
          <div className={cn(styles.rowMarker, styles.headCell)}>
            <span className="text-paper-mute">SEQ</span>
          </div>
          <div className={cn(styles.rowRuler, styles.headCell)}>
            <span ref={tcRef} className={styles.tlTc}>
              {tcAt(0)}
            </span>
          </div>
          {STEPS.map((s) => (
            <div
              key={s.track}
              className={cn(styles.rowLane, styles.headCell)}
              style={laneOrder(s.index)}
              data-on={step === s.index ? "" : undefined}
            >
              <span className={styles.trackName}>{s.track}</span>
              <span className={styles.trackDot} />
            </div>
          ))}
          <div className={cn(styles.rowAudio, styles.headCell)}>
            <span className={styles.trackName}>A1</span>
            <span className="text-paper-mute">· your team</span>
          </div>
        </div>

        {/* track area */}
        <div ref={areaRef} className={styles.tlArea}>
          <div className={styles.rowMarker} aria-hidden="true">
            <span className={styles.flag}>
              <span className={styles.flagGlyph} />
              FREE 30-MIN CALL
            </span>
          </div>

          <div className={cn(styles.rowRuler, styles.ruler)} aria-hidden="true">
            <svg className={styles.ticks} viewBox="0 0 1000 30" preserveAspectRatio="none">
              <path className={styles.tickMinor} d={MINOR_D} vectorEffect="non-scaling-stroke" />
              <path className={styles.tickMajor} d={MAJOR_D} vectorEffect="non-scaling-stroke" />
            </svg>
            {MAJORS.map((x, i) => (
              <span
                key={i}
                className={cn(
                  styles.tcLabel,
                  i % 2 === 1 && styles.tcOdd,
                  i === RULER_MAJORS - 1 && styles.tcPenult,
                  i === RULER_MAJORS && styles.tcLast,
                )}
                style={{ left: `${x * 100}%` }}
              >
                {tcAt(x)}
              </span>
            ))}
            <span className={styles.render} />
          </div>

          {STEPS.map((s) => {
            const active = step === s.index
            const dIn = DISSOLVES[s.index - 1] // overlap with the previous clip (at this clip's head)
            const dOut = DISSOLVES[s.index] // overlap with the next clip (at this clip's tail)
            const lead = dIn ? (dIn[1] - dIn[0]) / (s.clip[1] - s.clip[0]) : 0
            const style = { "--in": s.clip[0], "--out": s.clip[1], "--k": s.index, "--lead": lead.toFixed(4) } as CSSProperties
            return (
              <div key={s.track} className={cn(styles.rowLane, styles.lane)} style={laneOrder(s.index)}>
                <button
                  type="button"
                  className={cn("vf-host", styles.clip)}
                  style={style}
                  data-active={active ? "" : undefined}
                  aria-label={jumpLabel(s)}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onJump(s.index)}
                >
                  <ViewfinderFrame inset={5} arm={8} />
                  <span className={styles.clipBody} aria-hidden="true">
                    {dIn ? <Dissolve from={dIn[0]} to={dIn[1]} clip={s.clip} side="in" /> : null}
                    {dOut ? <Dissolve from={dOut[0]} to={dOut[1]} clip={s.clip} side="out" /> : null}
                    <span className={styles.clipLabel}>
                      <span className={styles.clipIdx}>{pad2(s.index + 1)}</span>
                      {s.title}
                    </span>
                  </span>
                  <span className={cn(styles.brk, styles.brkIn)} aria-hidden="true" />
                  <span className={cn(styles.brk, styles.brkOut)} aria-hidden="true" />
                  <span className={cn(styles.dia, styles.diaIn)} aria-hidden="true" />
                  <span className={cn(styles.dia, styles.diaOut)} aria-hidden="true" />
                </button>
              </div>
            )
          })}

          <div className={cn(styles.rowAudio, styles.lane, styles.audio)} aria-hidden="true">
            <svg className={styles.wave} viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} preserveAspectRatio="none">
              <defs>
                <clipPath id={`played-${clipId}`}>
                  <rect ref={playedRef} x="0" y="0" width={WAVE_W} height={WAVE_H} transform="scale(0 1)" />
                </clipPath>
              </defs>
              <path className={styles.waveBase} d={WAVE_D} />
              <path className={styles.wavePlayed} d={WAVE_D} clipPath={`url(#played-${clipId})`} />
            </svg>
          </div>

          {/* the playhead: 1px of throughline spanning ruler + tracks */}
          <div ref={headRef} className={styles.playhead} aria-hidden="true">
            <span className={cn("hairline hairline-y", styles.phLine)} />
            <span className={styles.phHead} />
          </div>
        </div>
      </div>
    </div>
  )
}
