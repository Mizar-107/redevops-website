"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import { useReducedMotionSafe } from "./use-motion-pref"

type Options = {
  /** Target frame rate. 30 skips alternate frames. Default 60. */
  fps?: 30 | 60
  /** Set false to stop the loop entirely. */
  enabled?: boolean
  /** IntersectionObserver rootMargin. Default "100px". */
  rootMargin?: string
  /** Drop quality to 0.5 once if frames are consistently slow. */
  adaptive?: boolean
}

/**
 * The one rAF source per component. Runs `cb(t, dt)` only while `target` intersects the viewport,
 * the tab is visible, motion is not reduced and `enabled !== false`. Stops completely otherwise.
 * t = performance.now() ms; dt = seconds since last tick, clamped to ≤ 1/30.
 */
export function useRafWhenVisible(
  target: RefObject<Element | null>,
  cb: (t: number, dt: number) => void,
  opts: Options = {},
): { quality: MutableRefObject<1 | 0.5> } {
  const cbRef = useRef(cb)
  const quality = useRef<1 | 0.5>(1)
  const reduced = useReducedMotionSafe()
  const { fps = 60, enabled = true, rootMargin = "100px", adaptive = false } = opts

  useEffect(() => {
    cbRef.current = cb
  })

  useEffect(() => {
    const el = target.current
    if (!el || !enabled || reduced) return
    const interval = fps === 30 ? 1000 / 30 : 0
    const slowThreshold = (interval || 1000 / 60) * 1.2
    let visible = false
    let running = false
    let raf = 0
    let last = 0
    let sum = 0
    let samples = 0

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (interval && last && t - last < interval - 2) return
      const frameMs = last ? t - last : 0
      const dt = last ? Math.min(frameMs / 1000, 1 / 30) : 1 / 60
      if (adaptive && quality.current === 1 && last) {
        sum += frameMs
        samples++
        if (samples === 30) {
          if (sum / samples > slowThreshold) quality.current = 0.5
          sum = 0
          samples = 0
        }
      }
      last = t
      cbRef.current(t, dt)
    }

    const update = () => {
      const should = visible && document.visibilityState === "visible"
      if (should && !running) {
        running = true
        last = 0
        sum = 0
        samples = 0
        raf = requestAnimationFrame(loop)
      } else if (!should && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting
        update()
      },
      { rootMargin },
    )
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
      cancelAnimationFrame(raf)
      running = false
    }
  }, [target, enabled, reduced, fps, rootMargin, adaptive])

  return { quality }
}
