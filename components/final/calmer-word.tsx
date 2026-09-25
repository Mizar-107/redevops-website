import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { lerp, mulberry32 } from "@/lib/motion/math"
import { fms } from "@/lib/motion/tokens"
import s from "./final.module.css"

/** poses per jitter cycle (one per f2 → 12 Hz) */
const POSES = 5
const STEP_MS = fms(2)
/** the jitter lasts the word's rise (f18) plus a hold (f12): 30 frames = 15 steps of f2 */
const JITTER_STEPS = 15

export type CalmerWordProps = {
  text?: string
  /** mulberry32 seed for the per-letter offsets */
  seed?: number
  className?: string
}

/**
 * "calmer", the page's only per-character treatment outside the hero. Server-safe and deterministic
 * (seeded, no measurement): each letter carries five seeded poses (y ±3px, rotate ±1.5°) as CSS vars.
 * When the parent mask-split heading reveals ([data-inview="1"]), the letters jitter through the
 * poses at 12 Hz (steps) while the words rise, hold f12, then settle to rest one by one (2f stagger)
 * on --spring-clap, snapping from paper to signal as they calm. It is visual only: render it inside
 * an aria-hidden split whose sr-only copy carries the sentence. SSR / no-JS / reduced: straight, signal.
 */
export function CalmerWord({ text = "calmer", seed = 19, className }: CalmerWordProps) {
  const rand = mulberry32(seed)
  const letters = Array.from(text)
  return (
    <span className={cn(s.calmer, className)}>
      {letters.map((ch, i) => {
        const vars: Record<string, string | number> = {}
        const poses: [string, string][] = []
        for (let k = 0; k < POSES; k++) {
          const y = `${lerp(-3, 3, rand()).toFixed(2)}px`
          const r = `${lerp(-1.5, 1.5, rand()).toFixed(2)}deg`
          poses.push([y, r])
          vars[`--y${k}`] = y
          vars[`--r${k}`] = r
        }
        // letter i jitters for (15 + i) steps, so the settles cascade left → right at f2
        const steps = JITTER_STEPS + i
        const last = poses[(steps - 1) % POSES]
        vars["--sy"] = last[0]
        vars["--sr"] = last[1]
        vars["--jn"] = steps / POSES
        vars["--ls"] = `${steps * STEP_MS}ms`
        return (
          <span key={i} className={s.letter} data-ch={ch} style={vars as CSSProperties}>
            {ch}
          </span>
        )
      })}
    </span>
  )
}
