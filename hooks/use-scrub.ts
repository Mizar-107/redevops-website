"use client"

import { useEffect, type RefObject } from "react"
import { useMotionValue, useScroll, useSpring, type MotionValue } from "framer-motion"
import { SPRING } from "@/lib/motion/tokens"
import { useReducedMotionSafe } from "./use-motion-pref"

export type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>

/**
 * Scroll progress of `target` through the viewport.
 * raw: straight from useScroll. progress: raw smoothed through SPRING.follow on fine pointers with
 * motion full; on coarse pointers or reduced motion it mirrors raw exactly (decided in an effect).
 */
export function useScrub(
  target: RefObject<HTMLElement | null>,
  offset: ScrollOffset,
): { raw: MotionValue<number>; progress: MotionValue<number> } {
  const { scrollYProgress: raw } = useScroll({ target, offset })
  const smooth = useSpring(raw, SPRING.follow)
  const progress = useMotionValue(0)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const src = fine && !reduced ? smooth : raw
    if (src === smooth) smooth.jump(raw.get())
    progress.set(src.get())
    return src.on("change", (v) => progress.set(v))
  }, [reduced, raw, smooth, progress])

  return { raw, progress }
}
