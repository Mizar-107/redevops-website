"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { cancelFrame, frame } from "framer-motion"
import { cn } from "@/lib/utils"
import { clamp } from "@/lib/motion/math"
import { useScrub } from "@/hooks/use-scrub"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { Reveal } from "@/components/motion/reveal"
import { END_LOG, STEPS, clipLabel, planBar, type ProcessStep } from "./process-data"
import styles from "./process.module.css"

/** Where this clip sits in the whole sequence: its segment lit, the other two ghosted. */
function MiniClip({ step }: { step: ProcessStep }) {
  return (
    <div className={styles.mini} aria-hidden="true">
      <span className={styles.miniTrack} />
      {STEPS.map((s) => (
        <span
          key={s.index}
          className={cn(styles.miniSeg, s.index === step.index ? styles.miniOn : styles.miniGhost)}
          style={{ "--in": s.clip[0], "--out": s.clip[1], "--row": s.index } as CSSProperties}
        >
          {s.index === step.index ? (
            <>
              <span className={cn(styles.miniBrk, styles.miniBrkIn)} />
              <span className={cn(styles.miniBrk, styles.miniBrkOut)} />
              <span className={cn(styles.miniDia, styles.miniDiaIn)} />
              <span className={cn(styles.miniDia, styles.miniDiaOut)} />
            </>
          ) : null}
        </span>
      ))}
    </div>
  )
}

/**
 * The stacked edit (<lg, reduced motion, MOTION off, no JS): an edit decision list of three clip
 * cards on a vertical ruler rail. With motion, the rail's signal fill is scrubbed by scroll and
 * each node lights as the fill passes it; otherwise it is fully drawn.
 */
export function StackedEdit() {
  const listRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const marks = useRef<number[]>([])
  const reduced = useReducedMotionSafe()
  const { progress } = useScrub(listRef, ["start 70%", "end 60%"])

  useEffect(() => {
    const list = listRef.current
    const fill = fillRef.current
    if (!list || !fill) return
    const nodes = nodeRefs.current
    if (reduced) {
      // still: the CSS default (fully drawn, every node lit)
      fill.style.transform = ""
      nodes.forEach((n) => n?.removeAttribute("data-lit"))
      return
    }
    let last = -1
    let lit = ""
    const render = () => {
      const p = clamp(progress.get())
      if (Math.abs(p - last) < 0.0002) return
      last = p
      fill.style.transform = `scaleY(${p.toFixed(4)})`
      let key = ""
      for (let i = 0; i < nodes.length; i++) key += p >= (marks.current[i] ?? 1) - 0.001 ? "1" : "0"
      if (key !== lit) {
        lit = key
        nodes.forEach((n, i) => n?.setAttribute("data-lit", key[i] === "1" ? "1" : "0"))
      }
    }
    // node positions along the rail, as fractions of its height
    const measure = () => {
      const rail = railRef.current
      const top = rail?.offsetTop ?? 0
      const h = rail?.offsetHeight || list.offsetHeight || 1
      marks.current = nodes.map((n) => {
        if (!n) return 1
        let y = 0
        let el: HTMLElement | null = n
        while (el && el !== list) {
          y += el.offsetTop
          el = el.offsetParent as HTMLElement | null
        }
        return clamp((y + n.offsetHeight / 2 - top) / h)
      })
      last = -1
      lit = ""
      render()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    let queued = false
    const run = () => {
      queued = false
      render()
    }
    const off = progress.on("change", () => {
      if (queued) return
      queued = true
      frame.update(run)
    })
    return () => {
      ro.disconnect()
      off()
      cancelFrame(run)
    }
  }, [progress, reduced])

  return (
    <div className={cn("shell pb-24 md:pb-32", styles.stackWrap)}>
      <div ref={listRef} className={styles.stack}>
        <span ref={railRef} className={styles.rail} aria-hidden="true">
          <span ref={fillRef} className={styles.railFill} />
        </span>
        <ol className={styles.stackList}>
          {STEPS.map((s) => (
            <Reveal key={s.index} as="li" mode="rise" className={styles.card}>
              <span
                ref={(el) => {
                  nodeRefs.current[s.index] = el
                }}
                className={styles.node}
                aria-hidden="true"
              />
              <div className={styles.cardHead}>
                <p className={styles.cardClip}>{clipLabel(s)}</p>
                <p className={styles.cardTc} aria-hidden="true">
                  {planBar(s.clip[1])}
                </p>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <h3 className="text-h3 text-paper text-balance">{s.title}</h3>
                </div>
                <div>
                  <p className="max-w-[56ch] text-body text-paper-dim text-pretty">{s.description}</p>
                  <MiniClip step={s} />
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
        <p className={styles.stackEnd} aria-hidden="true">
          <span
            ref={(el) => {
              nodeRefs.current[STEPS.length] = el
            }}
            className={cn(styles.node, styles.nodeEnd)}
          />
          {END_LOG}
        </p>
      </div>
    </div>
  )
}
