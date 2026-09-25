"use client"

import { useImperativeHandle, useRef, type Ref } from "react"
import { cn } from "@/lib/utils"
import { sectionLabel } from "@/lib/sections"
import { Hairline } from "@/components/motion/hairline"
import { ScrambleText } from "@/components/motion/scramble-text"
import styles from "./reel.module.css"

export type LetterboxHandle = {
  /**
   * lb: eased letterbox engagement 0..1 (bars scaleY from their outer edges, the inner edges ride in).
   * chapterPos: pp·4 (0..4) — each chapter track fills with its own local progress.
   */
  update(lb: number, chapterPos: number): void
}

export type LetterboxProps = {
  chapter: number
  chapters: readonly { label: string; title: string }[]
  onJump(index: number): void
  onChapterFocus?(index: number): void
  ref?: Ref<LetterboxHandle>
}

const pad2 = (n: number) => String(n).padStart(2, "0")

/**
 * The widescreen frame. Top and bottom ink bars whose inner edges are the throughline hairline.
 * The top bar carries the reel HUD, the bottom bar the four chapter buttons (the only focusable
 * or announced part; everything else is aria-hidden).
 */
export function Letterbox({ chapter, chapters, onJump, onChapterFocus, ref }: LetterboxProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const headRefs = useRef<(HTMLSpanElement | null)[]>([])
  const last = useRef<{ lb: string; fills: string[] }>({ lb: "", fills: [] })

  useImperativeHandle(
    ref,
    () => ({
      update(lb, chapterPos) {
        const root = rootRef.current
        if (!root) return
        const L = last.current
        const lbs = lb.toFixed(4)
        if (lbs !== L.lb) {
          L.lb = lbs
          root.style.setProperty("--lb", lbs)
        }
        for (let i = 0; i < fillRefs.current.length; i++) {
          const f = Math.min(1, Math.max(0, chapterPos - i))
          const fs = f.toFixed(4)
          if (fs === L.fills[i]) continue
          L.fills[i] = fs
          const fill = fillRefs.current[i]
          if (fill) fill.style.transform = `scaleX(${fs})`
          const head = headRefs.current[i]
          if (head) head.style.transform = `translate3d(${(f * 100).toFixed(2)}%,0,0)`
        }
      },
    }),
    [],
  )

  return (
    <div ref={rootRef} className={styles.lb}>
      {/* top bar: 01 / SERVICES ……… 0N / 04 */}
      <div className={styles.lbTop} aria-hidden="true">
        <div className={styles.lbFill} />
        <div className={styles.lbEdge}>
          <div className={cn("shell", styles.hudRow, "font-mono text-hud uppercase")}>
            <b>{sectionLabel("services")}</b>
            <ScrambleText text={`${pad2(chapter + 1)} / ${pad2(chapters.length)}`} trigger="change" />
          </div>
          <Hairline draw="none" className={styles.lbRule} />
        </div>
      </div>

      {/* bottom bar: chapter buttons */}
      <div className={styles.lbBot}>
        <div className={styles.lbFill} aria-hidden="true" />
        <div className={styles.lbEdge}>
          <Hairline draw="none" className={styles.lbRule} />
          <nav aria-label="Services chapters" className={styles.chapters}>
            <ul className={cn("shell", styles.chapterList)}>
              {chapters.map((ch, i) => (
                <li key={ch.label}>
                  <button
                    type="button"
                    className={cn(styles.chap, "font-mono text-hud uppercase")}
                    data-active={i === chapter ? "" : undefined}
                    aria-current={i === chapter ? "step" : undefined}
                    aria-label={`Jump to ${ch.title} chapter`}
                    onClick={() => onJump(i)}
                    onFocus={() => onChapterFocus?.(i)}
                  >
                    <span className={styles.chapLabel} aria-hidden="true">
                      <span className={styles.chapNum}>{pad2(i + 1)}</span>
                      <span>{ch.label}</span>
                    </span>
                    <span className={styles.track} aria-hidden="true">
                      <span
                        ref={(el) => {
                          fillRefs.current[i] = el
                        }}
                        className={styles.trackFill}
                      />
                      <span
                        ref={(el) => {
                          headRefs.current[i] = el
                        }}
                        className={styles.trackHead}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
