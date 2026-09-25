"use client"

import { useEffect, type RefObject } from "react"
import { useMotionValue, useScroll, useSpring, type MotionValue } from "framer-motion"
import { SPRING } from "@/lib/motion/tokens"
import { useReducedMotionSafe } from "./use-motion-pref"

export type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>

/**
 * Scroll progress of `target` through the viewport.
 * raw: straight from useScroll. progress: raw smoothed through SPRING.follow on fine pointers with
 * motion full; on coarse pointers or reduced motion it mirrors raw exactly (decided in an effect, so
 * no spring work runs at all there).
 */
export function useScrub(
  target: RefObject<HTMLElement | null>,
  offset: ScrollOffset,
): { raw: MotionValue<number>; progress: MotionValue<number> } {
  const { scrollYProgress: raw } = useScroll({ target, offset })
  // A free-standing spring (not bound to raw), fed only when smoothing is wanted.
  const smooth = useSpring(0, SPRING.follow)
  const progress = useMotionValue(0)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (fine && !reduced) {
      smooth.jump(raw.get())
      progress.set(raw.get())
      // useScroll measures after mount: the first real value must JUMP (a deep link landing mid-page
      // would otherwise spring 0 → p through every scene/letterbox in between); later values spring.
      let seeded = false
      const unFeed = raw.on("change", (v) => {
        if (seeded) smooth.set(v)
        else {
          seeded = true
          smooth.jump(v)
          progress.set(v)
        }
      })
      const unOut = smooth.on("change", (v) => progress.set(v))
      return () => {
        unFeed()
        unOut()
        smooth.stop()
      }
    }
    progress.set(raw.get())
    return raw.on("change", (v) => progress.set(v))
  }, [reduced, raw, smooth, progress])

  return { raw, progress }
}
