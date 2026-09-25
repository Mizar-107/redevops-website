"use client"

import { useEffect, useRef } from "react"
import { animate } from "framer-motion"
import { cn } from "@/lib/utils"
import { formatTC, scrollFrames } from "@/lib/motion/math"
import { DUR, EASE } from "@/lib/motion/tokens"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import type { RevealEventDetail } from "@/components/motion/motion-provider"

const ZERO = formatTC(0)

/**
 * "END OF REEL · TC hh:mm:ss:ff" (aria-hidden). SSR shows 00:00:00:00; on the client the timecode is
 * the reel's full length — the same value the scrub OSD reads at the very bottom of the page. The
 * first time it scrolls into view it rolls up from zero (f24, title); afterwards it tracks page-height
 * changes silently. Written to textContent, never through React state.
 */
export function EndTimecode({ className }: { className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    const root = rootRef.current
    const tc = tcRef.current
    if (!root || !tc) return
    const frames = () => scrollFrames(document.documentElement.scrollHeight - window.innerHeight)
    const write = (n: number) => {
      tc.textContent = formatTC(n)
    }
    let settled = false
    let stop: (() => void) | undefined

    const settle = () => {
      settled = true
      write(frames())
    }
    const roll = () => {
      if (reduced) return settle()
      const ctl = animate(0, frames(), {
        duration: DUR.f24,
        ease: EASE.title as unknown as [number, number, number, number],
        onUpdate: (v) => write(v),
        onComplete: settle,
      })
      stop = () => ctl.stop()
    }
    const onReveal = (e: Event) => {
      if ((e as CustomEvent<RevealEventDetail>).detail?.instant) settle()
      else roll()
    }

    if (root.getAttribute("data-inview")) settle()
    else root.addEventListener("rdo:reveal", onReveal, { once: true })

    let raf = 0
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => settled && write(frames()))
    }
    const ro = new ResizeObserver(refresh)
    ro.observe(document.body)
    window.addEventListener("resize", refresh, { passive: true })

    return () => {
      root.removeEventListener("rdo:reveal", onReveal)
      stop?.()
      ro.disconnect()
      window.removeEventListener("resize", refresh)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      data-reveal="custom"
      className={cn("whitespace-nowrap font-mono text-hud uppercase text-paper-mute", className)}
    >
      END OF REEL · TC{" "}
      <span ref={tcRef} className="text-paper-dim">
        {ZERO}
      </span>
    </span>
  )
}
