"use client"

import { Fragment, memo, useEffect, useRef, useState, type CSSProperties } from "react"
import { cancelFrame, frame, type MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { mixHex } from "@/lib/motion/math"
import type { SceneMode, SceneModule } from "@/lib/reel/scene"
import { SIGNAL, SignalLine, TUNGSTEN, type SignalFrame, type SignalLineHandle } from "./signal-line"
import styles from "./reel.module.css"

/** The throughline frame for one scene at progress v (pure). */
export function sceneLine(scene: SceneModule, v: number): SignalFrame {
  return { pts: scene.keyShape(v), smooth: scene.smooth, color: mixHex(TUNGSTEN, SIGNAL, scene.resolve(v)) }
}

export type SceneFrameProps = {
  scene: SceneModule
  mode: SceneMode
  progress: MotionValue<number>
  compact?: boolean
  active?: boolean
  className?: string
}

/**
 * One scene, self-contained: the scene's Furniture plus its own SignalLine. Used by the stacked
 * layout. "static" renders once at progress.get(); "play"/"scrub" subscribe to progress and redraw
 * the line through frame.update (no React renders).
 */
export function SceneFrame({ scene, mode, progress, compact, active = true, className }: SceneFrameProps) {
  const lineRef = useRef<SignalLineHandle>(null)
  const [initial] = useState(() => sceneLine(scene, progress.get()))

  useEffect(() => {
    if (mode === "static") return
    let queued = false
    const draw = () => {
      queued = false
      lineRef.current?.draw(sceneLine(scene, progress.get()))
    }
    draw()
    const off = progress.on("change", () => {
      if (queued) return
      queued = true
      frame.update(draw)
    })
    return () => {
      off()
      cancelFrame(draw)
    }
  }, [scene, mode, progress])

  const Furniture = scene.Furniture
  return (
    <div className={cn("absolute inset-0", className)}>
      <Furniture progress={progress} mode={mode} active={active} compact={compact} />
      <SignalLine ref={lineRef} initial={initial} className="absolute inset-0 h-full w-full overflow-visible" />
    </div>
  )
}

export type TagLineProps = {
  tags: readonly string[]
  /** per-character tracking-in (pinned stage) */
  track?: boolean
  /** beat index rendered with data-on in SSR (later changes are imperative) */
  initialOn?: number
  /** collects the beat <span>s so callers can move data-on without React */
  beatRef?: (el: HTMLSpanElement | null, index: number) => void
  className?: string
}

/**
 * The mono tag line: each beat is a <span>, joined by arrows. The active beat carries data-on
 * (signal); written imperatively by the stage. An sr-only copy carries the plain text.
 */
function TagLineImpl({ tags, track, initialOn, beatRef, className }: TagLineProps) {
  // one global character index across the whole line so tracking converges on its centre
  const segments: { text: string; beat: number | null }[] = []
  tags.forEach((t, i) => {
    segments.push({ text: t, beat: i })
    if (i < tags.length - 1) segments.push({ text: "→", beat: null })
  })
  const totalChars = segments.reduce((n, s) => n + s.text.replace(/\s+/g, "").length, 0)
  const center = (totalChars - 1) / 2
  let ci = 0

  const renderWords = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean)
    return words.map((w, wi) => (
      <Fragment key={wi}>
        {track ? (
          <span className={styles.word}>
            {Array.from(w).map((c, k) => {
              const style = { "--k": (ci++ - center).toFixed(1) } as CSSProperties
              return (
                <span key={k} className={styles.ch} style={style}>
                  {c}
                </span>
              )
            })}
          </span>
        ) : (
          <span className={styles.word}>{w}</span>
        )}
        {wi < words.length - 1 ? " " : null}
      </Fragment>
    ))
  }

  return (
    <p className={cn("font-mono text-hud uppercase leading-[1.6]", styles.tags, className)}>
      <span className="sr-only select-none">{tags.join(", ")}</span>
      <span aria-hidden="true">
        {segments.map((s, i) => (
          <Fragment key={i}>
            {s.beat == null ? (
              <span className={styles.arrow}>{renderWords(s.text)}</span>
            ) : (
              <span
                ref={beatRef ? (el) => beatRef(el, s.beat as number) : undefined}
                className={styles.beat}
                data-on={initialOn === s.beat ? "" : undefined}
              >
                {renderWords(s.text)}
              </span>
            )}
            {i < segments.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </p>
  )
}

/** Memoised: pass a stable beatRef so chapter renders on the stage skip the per-character markup. */
export const TagLine = memo(TagLineImpl)
