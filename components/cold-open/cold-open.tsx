import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { COLD_OPEN, DUR_MS } from "@/lib/motion/tokens"
import { Hairline } from "@/components/motion/hairline"
import styles from "./cold-open.module.css"

/** The film-leader slate (spec copy), one entry per line; "v" segments are the values (a tone brighter). */
type Seg = readonly [text: string, tone: "k" | "v"]
const SLATE: readonly (readonly Seg[])[] = [
  [["PROD.", "k"], ["REDEVOPS", "v"]],
  [["DIR.", "k"], ["RECEP", "v"]],
  [["SC", "k"], ["01", "v"], ["·", "k"], ["TK", "k"], ["01", "v"]],
  [["24", "v"], ["FPS", "k"]],
]

/**
 * Every beat of the overlay is timed from lib/motion/tokens.ts COLD_OPEN (ms from first paint), written
 * here as CSS custom properties so the stylesheet never carries its own copy of the timeline.
 * The skip exit runs one f4 move so input → gone stays inside the COLD_OPEN.skipExit (200ms) budget
 * even with a frame of input latency.
 */
const TIMELINE = {
  "--co-line-at": `${COLD_OPEN.lineDraw[0]}ms`,
  "--co-line-dur": `${COLD_OPEN.lineDraw[1] - COLD_OPEN.lineDraw[0]}ms`,
  "--co-blip-at": `${COLD_OPEN.blip[0]}ms`,
  "--co-blip-dur": `${COLD_OPEN.blip[1] - COLD_OPEN.blip[0]}ms`,
  "--co-part-at": `${COLD_OPEN.part[0]}ms`,
  "--co-part-dur": `${COLD_OPEN.part[1] - COLD_OPEN.part[0]}ms`,
  "--co-exit-at": `${COLD_OPEN.exit[0]}ms`,
  "--co-off-at": `${COLD_OPEN.total - 1}ms`,
  "--co-skip": `${Math.min(COLD_OPEN.skipExit, DUR_MS.f4)}ms`,
} as CSSProperties

/**
 * THROUGHLINE cold open. A CSS-only, self-dismissing title overlay (no JS in this component):
 * slate type-in → the hairline draws from the centre → a blip runs the line → the black halves part
 * to a 2.39:1 letterbox (the hairline row is the hero horizon: match cut) → hold → bars exit.
 *
 * It is display:none unless the pre-paint boot script set html[data-intro="play" | "skip"], so
 * visitors without JS, with reduced motion, on a repeat visit in the session or on a hash deep link
 * never see it. It reaches visibility:hidden by COLD_OPEN.total through fill-mode, even if the JS
 * bundle never loads. Any input during play flips data-intro to "skip" (boot script), which freezes
 * the timeline and runs one short exit.
 */
export function ColdOpen() {
  return (
    <>
      <div
        id="cold-open"
        aria-hidden="true"
        className={cn(styles.root, "pointer-events-none fixed inset-0 z-[100]")}
        style={TIMELINE}
      >
        <div className={cn(styles.bar, styles.barTop)}>
          <div className={styles.fill} />
        </div>
        <div className={cn(styles.bar, styles.barBot)}>
          <div className={styles.fill} />
        </div>

        <div className={styles.fx}>
          <Hairline draw="none" className={styles.line} />
          <span className={styles.blip}>
            <span className={styles.blipTrail} />
            <span className={styles.blipHead} />
          </span>
          <p className={cn(styles.slate, "font-mono")}>
            {SLATE.map((line, i) => (
              <span key={i} className={styles.slateLine}>
                {line.map(([text, tone], j) => (
                  <span key={j} className={tone === "v" ? styles.slateVal : undefined}>
                    {j > 0 ? " " : ""}
                    {text}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>
      </div>

      <button id="cold-open-skip" type="button" className={cn(styles.skip, "fixed bottom-6 right-6 z-[101]")} style={TIMELINE}>
        <span className={cn(styles.skipPill, "font-mono")}>
          <span>Skip intro</span>
          <span aria-hidden="true" className={styles.skipArrow}>
            ▸
          </span>
          <kbd aria-hidden="true" className={styles.kbd}>
            ESC
          </kbd>
        </span>
      </button>
    </>
  )
}
