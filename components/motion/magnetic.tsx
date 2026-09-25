"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { motion, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import { clamp } from "@/lib/motion/math"
import { SPRING } from "@/lib/motion/tokens"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"

export type MagneticProps = {
  children: ReactNode
  /** fraction of the pointer offset applied (default 0.22) */
  strength?: number
  /** px cap (default 8) */
  max?: number
  className?: string
}

/**
 * Moves ONLY its own inner span toward the pointer. The hit area is the closest [data-magnet-host]
 * ancestor, which never moves. Fine pointers + motion full only; resets while the host is focused.
 */
export function Magnetic({ children, strength = 0.22, max = 8, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useSpring(0, SPRING.magnet)
  const y = useSpring(0, SPRING.magnet)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const host = el.closest<HTMLElement>("[data-magnet-host]")
    if (!host) return
    const reset = () => {
      x.set(0)
      y.set(0)
    }
    const move = (e: PointerEvent) => {
      if (host.matches(":focus-visible")) return reset()
      const r = host.getBoundingClientRect()
      x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength, -max, max))
      y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength, -max, max))
    }
    host.addEventListener("pointermove", move)
    host.addEventListener("pointerleave", reset)
    host.addEventListener("focus", reset)
    return () => {
      host.removeEventListener("pointermove", move)
      host.removeEventListener("pointerleave", reset)
      host.removeEventListener("focus", reset)
      reset()
    }
  }, [reduced, strength, max, x, y])

  return (
    <motion.span ref={ref} className={cn("inline-flex items-center", className)} style={{ x, y }}>
      {children}
    </motion.span>
  )
}
