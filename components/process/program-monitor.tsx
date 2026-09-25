"use client"

import { useEffect, useRef, type CSSProperties, type Ref } from "react"
import { animate, type AnimationPlaybackControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { DUR_MS } from "@/lib/motion/tokens"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import type { RevealEventDetail } from "@/components/motion/motion-provider"
import { END_LOG, STEPS, pad2, planBar, stepCount, type StepIndex } from "./process-data"
import styles from "./process.module.css"

/** Run-log typing speed (characters per second). */
const CPS = 32
/** Photosensitivity: never more than 3 cut flashes per second, however fast the playhead is scrubbed. */
const FLASH_GAP_MS = 334

type Slots = [string, string, string]
const slotsFor = (step: StepIndex, end: boolean): Slots => [STEPS[step].log[0], STEPS[step].log[1], end ? END_LOG : ""]

type ProgramMonitorProps = {
  step: StepIndex
  end: boolean
  /** plan-progress readout (top-right); written per frame by the stage via textContent */
  tcRef?: Ref<HTMLSpanElement>
}

/**
 * The program monitor (top of the pinned stage). Entirely aria-hidden: the real step content lives
 * in the stage's sr-only <ol>. All three steps are rendered as stacked layers; data-state
 * (before / active / after) drives the hard cut in CSS, direction-aware when scrubbing back.
 * The run log types via textContent (no React renders).
 */
export function ProgramMonitor({ step, end, tcRef }: ProgramMonitorProps) {
  const monRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLSpanElement>(null)
  const textRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rowRefs = useRef<(HTMLSpanElement | null)[]>([])
  const shown = useRef<string[]>(slotsFor(0, false))
  const typing = useRef<AnimationPlaybackControls | null>(null)
  const lastFlash = useRef(-Infinity)
  const prev = useRef({ step, end })

  const setText = (i: number, t: string) => {
    if (shown.current[i] === t) return
    shown.current[i] = t
    const el = textRefs.current[i]
    if (el) el.textContent = t
  }
  const caret = useRef("")
  const setCaret = (i: number, v: "on" | "done" | null) => {
    const key = `${i}:${v}`
    if (caret.current === key) return
    caret.current = key
    rowRefs.current.forEach((row, k) => {
      if (!row) return
      const want = k === i ? v : null
      if (want) row.setAttribute("data-caret", want)
      else row.removeAttribute("data-caret")
    })
  }

  /** Write slots < from instantly; type the rest in order at CPS after delayMs. */
  const type = (lines: Slots, from: number, delayMs: number) => {
    typing.current?.stop()
    typing.current = null
    lines.forEach((t, i) => setText(i, i < from ? t : ""))
    setCaret(-1, null)
    const todo = lines.map((t, i) => (i < from ? 0 : t.length))
    const total = todo.reduce((a, b) => a + b, 0)
    if (!total) return
    typing.current = animate(0, total, {
      duration: total / CPS,
      delay: delayMs / 1000,
      ease: "linear",
      onUpdate: (v) => {
        let n = Math.floor(v)
        let cur = -1
        for (let i = from; i < 3; i++) {
          const len = lines[i].length
          const k = Math.max(0, Math.min(len, n))
          setText(i, lines[i].slice(0, k))
          if (cur < 0 && len && k < len) cur = i
          n -= len
        }
        setCaret(cur, cur >= 0 ? "on" : null)
      },
      onComplete: () => {
        lines.forEach((t, i) => setText(i, t))
        const lastIdx = lines[2] ? 2 : 1
        setCaret(lastIdx, "done")
        typing.current = null
      },
    })
  }

  // Hard cut on step change; the end latch appends the final log line.
  useEffect(() => {
    const was = prev.current
    prev.current = { step, end }
    if (was.step === step && was.end === end) return
    const lines = slotsFor(step, end)
    if (was.step !== step) {
      const now = performance.now()
      if (now - lastFlash.current >= FLASH_GAP_MS) {
        lastFlash.current = now
        flashRef.current?.animate(
          [{ opacity: 0.08 }, { opacity: 0.08, offset: 0.99 }, { opacity: 0 }],
          { duration: DUR_MS.f2, easing: "linear" },
        )
      }
      type(lines, 0, DUR_MS.f12)
    } else {
      type(lines, 2, end ? DUR_MS.f6 : 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, end])

  // Power-on: the first time the monitor is revealed (not if it was already on screen at load),
  // the log types in once the screen has opened.
  useEffect(() => {
    const el = monRef.current
    if (!el) return
    const onReveal = (e: Event) => {
      if ((e as CustomEvent<RevealEventDetail>).detail?.instant) return
      type(slotsFor(prev.current.step, prev.current.end), 0, DUR_MS.f24 + DUR_MS.f6)
    }
    el.addEventListener("rdo:reveal", onReveal)
    return () => {
      el.removeEventListener("rdo:reveal", onReveal)
      typing.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initial = slotsFor(0, false)

  return (
    <div ref={monRef} className={cn("vf-host", styles.monitor)} data-reveal="custom" aria-hidden="true">
      <ViewfinderFrame always />
      <div className={styles.screen}>

        <span className={styles.pgm}>
          <span className={styles.pgmDot} />
          NOW
        </span>
        <span ref={tcRef} className={styles.tc}>
          {planBar(0)}
        </span>

        <div className={styles.safe}>
          <div className={styles.layers}>
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.index}
                  className={styles.layer}
                  data-state={s.index === step ? "active" : s.index > step ? "before" : "after"}
                >
                  <div className={styles.meta}>
                    <Icon className={styles.icon} strokeWidth={1.5} />
                    <span className={styles.metaCount}>{stepCount(s.index)}</span>
                    <span className={styles.metaClip}>{s.lane}</span>
                  </div>
                  <div className={styles.titleMatte}>
                    <div className={styles.titleIn}>{s.title}</div>
                  </div>
                  <p className={styles.desc}>{s.description}</p>
                  <span className={styles.numMatte}>
                    <span className={styles.numIn}>{pad2(s.index + 1)}</span>
                  </span>
                </div>
              )
            })}
          </div>

          <div className={styles.log}>
            {initial.map((t, i) => (
              <span
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el
                }}
                className={cn(styles.logLine, i === 2 && styles.logEnd)}
                style={{ "--ln": i } as CSSProperties}
              >
                <span
                  ref={(el) => {
                    textRefs.current[i] = el
                  }}
                >
                  {t}
                </span>
                <span className={styles.caret} />
              </span>
            ))}
          </div>
        </div>

        <span ref={flashRef} className={styles.flash} />
      </div>
      <span className={cn("hairline", styles.bootLine)} />
    </div>
  )
}
