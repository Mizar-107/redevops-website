"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"
import { reelLabel } from "@/lib/sections"
import { formatTC, scrollFrames } from "@/lib/motion/math"
import { useActiveSection } from "@/hooks/use-active-section"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { useChrome } from "@/components/motion/motion-provider"
import { ScrambleText } from "@/components/motion/scramble-text"

/** How long the OSD lingers after the last scroll event before it fades out (spec: 900ms). */
const IDLE_MS = 900
const LG = "(min-width: 1024px)"
const TC_ZERO = formatTC(0)

/**
 * Scrub OSD (lg+ only): a broadcast on-screen display that surfaces only while the page is being
 * scrubbed. `● REC  REEL 03 · OUTCOMES  TC 00:01:23:14` (+ a `2.39:1` chip while the Services
 * letterbox is engaged).
 *
 * - The reel label comes from useActiveSection() and scrambles on change: the only React renders,
 *   and they happen on section boundaries only.
 * - TC = formatTC(scrollFrames(scrollY)), written straight to textContent from one passive,
 *   rAF-coalesced scroll listener. No React state per frame.
 * - data-active on scroll → fade in f6; 900ms without scroll → fade out f18 (exit).
 * - aria-hidden, pointer-events none, hidden entirely under still (no JS / reduced / MOTION off)
 *   and under forced colours.
 */
export function ScrubOsd() {
  const section = useActiveSection()
  const { letterbox } = useChrome()
  const reduced = useReducedMotionSafe()
  const rootRef = useRef<HTMLDivElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const wideRef = useRef(false)
  const [wide, setWide] = useState(false)

  // 2.39:1 chip: a React render only when the letterbox crosses 0.5
  const syncWide = useCallback((v: number) => {
    const w = v > 0.5
    if (w === wideRef.current) return
    wideRef.current = w
    setWide(w)
  }, [])
  useMotionValueEvent(letterbox, "change", syncWide)
  useEffect(() => syncWide(letterbox.get()), [letterbox, syncWide])

  useEffect(() => {
    const root = rootRef.current
    const tc = tcRef.current
    if (!root || !tc || reduced) return
    const mq = window.matchMedia(LG)
    let raf = 0
    let idle: ReturnType<typeof setTimeout> | undefined
    let lastTc = ""
    let attached = false

    const writeTc = () => {
      const s = formatTC(scrollFrames(window.scrollY))
      if (s !== lastTc) {
        lastTc = s
        tc.textContent = s
      }
    }
    const hide = () => root.removeAttribute("data-active")
    const tick = () => {
      raf = 0
      writeTc()
      if (!root.hasAttribute("data-active")) root.setAttribute("data-active", "")
      clearTimeout(idle)
      idle = setTimeout(hide, IDLE_MS)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const sync = () => {
      if (mq.matches && !attached) {
        attached = true
        writeTc()
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
      // Plain join, not cn(): tailwind-merge would drop the custom `text-hud` size next to a text colour.
      className={[
        "pointer-events-none fixed bottom-5 left-6 z-[46] hidden h-7 items-center gap-2.5 lg:flex still:!hidden forced:!hidden",
        // 28px tall like the MOTION pill opposite, so the two pieces of chrome sit on one baseline
        "whitespace-nowrap rounded-full border border-line bg-ink-950/70 px-[10px] py-[6px]",
        "font-mono text-hud uppercase text-paper-mute",
        // fade in f6 (ui) when data-active lands; fade out f18 (exit) when it is removed
        "opacity-0 transition-opacity duration-f18 ease-exit data-[active]:opacity-100 data-[active]:duration-f6 data-[active]:ease-ui",
      ].join(" ")}
    >
      <span className="flex items-center gap-[6px] text-paper-dim">
        <span className="size-[6px] rounded-full bg-alarm/80" />
        REC
      </span>
      <Rule />
      <ScrambleText text={reelLabel(section)} trigger="change" className="text-paper-dim" />
      <Rule />
      <span>
        TC{" "}
        {/* written imperatively; React owns only the constant initial markup */}
        <span ref={tcRef} className="text-paper-dim" dangerouslySetInnerHTML={{ __html: TC_ZERO }} />
      </span>
      <span
        className={cn(
          "rounded-[3px] border border-signal/40 px-[5px] py-[3px] leading-none text-signal",
          !wide && "hidden",
        )}
      >
        <ScrambleText text={wide ? "2.39:1" : ""} trigger="change" />
      </span>
    </div>
  )
}

/** 1px group divider, broadcast-OSD style. */
function Rule() {
  return <span className="h-2.5 w-px bg-line-strong" />
}
