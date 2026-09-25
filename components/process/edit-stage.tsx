"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cancelFrame, frame } from "framer-motion"
import { cn } from "@/lib/utils"
import { clamp } from "@/lib/motion/math"
import { sectionLabel, section } from "@/lib/sections"
import { useScrub } from "@/hooks/use-scrub"
import { useStickyGuard } from "@/hooks/use-sticky-guard"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { ScrambleText } from "@/components/motion/scramble-text"
import { END_OFF, END_ON, JUMP, PIN_MQ, STEPS, clipLabel, planBar, stepAt, type StepIndex } from "./process-data"
import { ProgramMonitor } from "./program-monitor"
import { Timeline, levelAt, type TimelineHandle } from "./timeline"
import styles from "./process.module.css"

type StageState = { enabled: boolean; lastP: number; step: StepIndex; end: boolean; frame: number; lv: string }

/**
 * REEL 04 · PROCESS — the pinned edit (lg + motion full). Scroll is the playhead: one progress
 * subscription writes the playhead, timecodes, waveform and meters imperatively; React renders only
 * when the step changes (≤ 2 cuts across a scrub) and when the end latch flips.
 */
export function EditStage() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<TimelineHandle>(null)
  const monTcRef = useRef<HTMLSpanElement>(null)
  const tlTcRef = useRef<HTMLSpanElement>(null)
  const meterRefs = useRef<(HTMLSpanElement | null)[]>([])

  useStickyGuard(stageRef)
  const { progress } = useScrub(wrapRef, ["start start", "end end"])
  const reduced = useReducedMotionSafe()
  const [step, setStep] = useState<StepIndex>(0)
  const [end, setEnd] = useState(false)
  const st = useRef<StageState>({ enabled: false, lastP: -1, step: 0, end: false, frame: -1, lv: "" })

  const render = useCallback((raw: number) => {
    const s = st.current
    const p = clamp(raw)
    s.lastP = raw

    tlRef.current?.update(p)

    const fr = Math.round(p * 120)
    if (fr !== s.frame) {
      s.frame = fr
      const bar = planBar(p)
      if (monTcRef.current) monTcRef.current.textContent = bar
      if (tlTcRef.current) tlTcRef.current.textContent = bar
    }

    const l0 = levelAt(p, 0).toFixed(3)
    const l1 = levelAt(p, 1).toFixed(3)
    const lv = l0 + l1
    if (lv !== s.lv) {
      s.lv = lv
      const [m0, m1] = meterRefs.current
      if (m0) m0.style.transform = `scaleY(${l0})`
      if (m1) m1.style.transform = `scaleY(${l1})`
    }

    // discrete boundaries → the only React renders
    const next = stepAt(p)
    if (next !== s.step) {
      s.step = next
      setStep(next)
    }
    const e = s.end ? p >= END_OFF : p >= END_ON
    if (e !== s.end) {
      s.end = e
      setEnd(e)
    }
  }, [])

  // Only drive anything while the pinned layout is actually displayed (PIN_MQ + motion full).
  useEffect(() => {
    const mq = window.matchMedia(PIN_MQ)
    const sync = () => {
      const on = mq.matches && !reduced
      st.current.enabled = on
      if (on) render(progress.get())
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [reduced, progress, render])

  useEffect(() => {
    let queued = false
    const run = () => {
      queued = false
      if (st.current.enabled) render(progress.get())
    }
    const off = progress.on("change", (p) => {
      const s = st.current
      if (!s.enabled || Math.abs(p - s.lastP) < 0.0002) return
      if (queued) return
      queued = true
      frame.update(run)
    })
    return () => {
      off()
      cancelFrame(run)
    }
  }, [progress, render])

  const onJump = useCallback(
    (i: number) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const top = wrap.getBoundingClientRect().top + window.scrollY
      const span = wrap.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + JUMP[i] * span, behavior: reduced ? "auto" : "smooth" })
    },
    [reduced],
  )

  const cur = STEPS[step]
  const meta = section("process")

  return (
    <div ref={wrapRef} className={cn("relative hidden", styles.pinWrap)}>
      {/* what the stage shows, for screen readers, exactly once */}
      <ol className="sr-only select-none">
        {STEPS.map((s) => (
          <li key={s.index}>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </li>
        ))}
      </ol>

      <div
        ref={stageRef}
        className={cn(
          "top-0 flex h-[100svh] flex-col overflow-clip pt-[calc(var(--header-h)+16px)]",
          styles.stage,
          styles.pinStage,
        )}
      >
        <div className={cn("shell", styles.viewer)}>
          {/* inspector (xl): the clip under the playhead */}
          <div className={styles.inspector} aria-hidden="true">
            <p className={styles.inspReel}>{sectionLabel("process")}</p>
            <dl className={styles.insp}>
              <div className={styles.inspStatic}>
                <dt>PLAN</dt>
                <dd>FIRST CALL → HANDOVER</dd>
              </div>
              <div className={styles.inspStatic}>
                <dt>MODE</dt>
                <dd>WITH YOUR TEAM</dd>
              </div>
              <div>
                <dt>PHASE</dt>
                <dd className="text-signal">
                  <ScrambleText text={clipLabel(cur)} trigger="change" />
                </dd>
              </div>
            </dl>
          </div>

          <ProgramMonitor step={step} end={end} tcRef={monTcRef} />

          {/* team-load meters (xl), driven by the team lane under the playhead */}
          <div className={styles.meters} aria-hidden="true">
            <span className={styles.meterLabel}>TEAM</span>
            <div className={styles.meterPair}>
              {[0, 1].map((c) => (
                <span key={c} className={styles.meter}>
                  <span
                    ref={(el) => {
                      meterRefs.current[c] = el
                    }}
                    className={styles.meterFill}
                    style={{ transform: `scaleY(${levelAt(0, c as 0 | 1).toFixed(3)})` }}
                  />
                </span>
              ))}
            </div>
            <span className={styles.meterLabel}>LOAD</span>
          </div>
        </div>

        <Timeline step={step} end={end} onJump={onJump} handleRef={tlRef} tcRef={tlTcRef} />
      </div>
    </div>
  )
}
