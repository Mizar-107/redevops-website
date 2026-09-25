import { Fragment, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { staggerFor } from "@/lib/motion/tokens"
import { Slate } from "@/components/motion/slate"
import { Reveal } from "@/components/motion/reveal"
import { EditStage } from "./edit-stage"
import { StackedEdit } from "./stacked-edit"
import styles from "./process.module.css"

const TITLE = "A clear path from first call to handover"
/** Words (by index) that carry the drawn underline. */
const MARKED = [1, 2] // "clear path"

/**
 * H2 as a mask reveal (the global .split/.w/.wi matte), with an SVG hairline that draws under
 * "clear path" once the words have landed, finished by two keyframe diamonds (the in and out points
 * of the edit to come). Server-safe; one sr-only copy carries the real string.
 */
function EditTitle({ className }: { className?: string }) {
  const words = TITLE.split(" ")
  const st = staggerFor(words.length, 83, 500)
  const w = (i: number) => (
    <span className="w" style={{ "--wd": `${Math.round(i * st)}ms` } as CSSProperties}>
      <span className="wi">{words[i]}</span>
    </span>
  )
  const [a, b] = MARKED
  return (
    <h2 id="process-title" className={cn("split", styles.title, className)} data-reveal="mask">
      <span className="sr-only">{TITLE}</span>
      <span aria-hidden="true">
        {words.slice(0, a).map((_, i) => (
          <Fragment key={i}>
            {w(i)}{" "}
          </Fragment>
        ))}
        <span className={styles.mark}>
          {w(a)} {w(b)}
          <svg className={styles.ul} viewBox="0 0 100 10" preserveAspectRatio="none">
            <path className={styles.ulHalo} d="M0.6 6.2C28 4.4 64 3.9 99.4 5.1" pathLength={1} />
            <path className={styles.ulCore} d="M0.6 6.2C28 4.4 64 3.9 99.4 5.1" pathLength={1} />
          </svg>
          <span className={cn(styles.ulDia, styles.ulDiaIn)} />
          <span className={cn(styles.ulDia, styles.ulDiaOut)} />
        </span>
        {words.slice(b + 1).map((_, k) => (
          <Fragment key={k}>
            {" "}
            {w(b + 1 + k)}
          </Fragment>
        ))}
      </span>
    </h2>
  )
}

/**
 * REEL 04 · PROCESS — "The Edit".
 * Intro in normal flow, then two server-rendered layouts of which CSS displays exactly one:
 * the pinned NLE stage (lg + motion full) or the stacked edit list (everything else).
 */
export function ProcessSection() {
  return (
    <section id="process" aria-labelledby="process-title" className="relative">
      <div className="shell grid gap-6 pb-16 pt-24 md:pb-20 md:pt-32 lg:grid-cols-12 lg:gap-x-8">
        <Slate section="process" className="lg:col-span-12" />
        <EditTitle className="max-w-4xl text-h2 text-balance lg:col-span-7" />
        <Reveal
          as="p"
          delay={250}
          className="max-w-[60ch] text-lede text-paper-dim text-pretty lg:col-span-5 lg:self-end lg:justify-self-end"
        >
          Transparent steps, visible priorities, and work that fits how product teams already ship.
        </Reveal>
      </div>

      <EditStage />
      <StackedEdit />
    </section>
  )
}
