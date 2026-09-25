"use client"

import { useEffect, useRef } from "react"
import { sectionLabel } from "@/lib/sections"
import { useActiveSection } from "@/hooks/use-active-section"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { ScrambleText } from "@/components/motion/scramble-text"

/** How long the indicator lingers after the last scroll event before it fades out. */
const IDLE_MS = 900
const LG = "(min-width: 1024px)"

/**
 * Scroll indicator (lg+ only) that surfaces only while the page is scrolling:
 * `●  02 / OUTCOMES  ▬▬▬▭▭▭`: the current section and a page-progress meter.
 *
 * - The section label comes from useActiveSection() and decodes on change: the only React renders,
 *   and they happen on section boundaries only.
 * - The meter is written straight to a transform from one passive, rAF-coalesced scroll listener.
 *   No React state per frame. scrollY is read in the scroll event, never inside the rAF.
 * - data-active on scroll → fade in f6; 900ms without scroll → fade out f18 (exit).
 * - aria-hidden, pointer-events none, hidden entirely under still (no JS / reduced / MOTION off)
 *   and under forced colours.
 */
export function ScrubOsd() {
  const section = useActiveSection()
  const reduced = useReducedMotionSafe()
  const rootRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const fill = fillRef.current
    if (!root || !fill || reduced) return
    const mq = window.matchMedia(LG)
    let raf = 0
    let idle: ReturnType<typeof setTimeout> | undefined
    let attached = false
    let p = 0
    let last = -1

    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    const write = () => {
      const v = Math.round(p * 1000) / 1000
      if (v !== last) {
        last = v
        fill.style.transform = `scaleX(${v})`
      }
    }
    const hide = () => root.removeAttribute("data-active")
    const tick = () => {
      raf = 0
      write()
      if (!root.hasAttribute("data-active")) root.setAttribute("data-active", "")
      clearTimeout(idle)
      idle = setTimeout(hide, IDLE_MS)
    }
    const onScroll = () => {
      measure()
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const sync = () => {
      if (mq.matches && !attached) {
        attached = true
        measure()
        write()
        window.addEventListener("scroll", onScroll, { passive: true })
      } else if (!mq.matches && attached) {
        attached = false
        window.removeEventListener("scroll", onScroll)
        cancelAnimationFrame(raf)
        raf = 0
        clearTimeout(idle)
        hide()
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => {
      mq.removeEventListener("change", sync)
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
      clearTimeout(idle)
      hide()
    }
  }, [reduced])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      // Plain join, not cn(): keeps the custom `text-hud` size next to a text colour.
      className={[
        "pointer-events-none fixed bottom-5 left-6 z-[46] hidden h-7 items-center gap-2.5 lg:flex still:!hidden forced:!hidden",
        // 28px tall like the MOTION pill opposite, so the two pieces of chrome sit on one baseline
        "whitespace-nowrap rounded-full border border-line bg-ink-950/70 px-[10px] py-[6px]",
        "font-mono text-hud uppercase text-paper-mute",
        // fade in f6 (ui) when data-active lands; fade out f18 (exit) when it is removed
        "opacity-0 transition-opacity duration-f18 ease-exit data-[active]:opacity-100 data-[active]:duration-f6 data-[active]:ease-ui",
      ].join(" ")}
    >
      <span className="size-[6px] rounded-full bg-signal shadow-[0_0_8px_rgba(34,211,238,.7)]" />
      <ScrambleText text={sectionLabel(section)} trigger="change" className="text-paper-dim" />
      <span className="relative h-px w-14 overflow-hidden bg-line-strong">
        <span
          ref={fillRef}
          className="absolute inset-0 origin-left bg-signal"
          style={{ transform: "scaleX(0)" }}
        />
      </span>
    </div>
  )
}
