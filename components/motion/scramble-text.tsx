"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { introRemaining } from "@/lib/motion/pref"
import { fms } from "@/lib/motion/tokens"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import type { RevealEventDetail } from "./motion-provider"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/:—·"
const MAX_MS = fms(14) // 583

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export type ScrambleTextProps = {
  text: string
  className?: string
  /** view: on reveal (skipped if it was already in view at load). intro: at --hero-t0 + delay. change: whenever text changes. */
  trigger?: "view" | "intro" | "change"
  /** ms */
  delay?: number
  /** total ms, ≤ 583 */
  duration?: number
}

/**
 * Decode effect for MONO strings only (slates, OSD, labels). Never on headings, body copy or the
 * email address. SSR renders the final string; equal-advance mono glyphs mean zero layout shift.
 * Frames are written to textContent at ~30 Hz, never through React state.
 */
export function ScrambleText({ text, className, trigger = "view", delay = 0, duration }: ScrambleTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const visRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotionSafe()
  const first = useRef(true)
  const prevText = useRef(text)

  useEffect(() => {
    const vis = visRef.current
    const root = rootRef.current
    if (!vis || !root) return
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const run = () => {
      if (reduced) {
        vis.textContent = text
        return
      }
      const chars = Array.from(text)
      const total = Math.min(duration ?? chars.length * fms(1), MAX_MS)
      const step = total / Math.max(1, chars.length)
      const start = performance.now()
      let lastWrite = 0
      const tick = (now: number) => {
        const el = now - start
        if (now - lastWrite >= 33 || el >= total) {
          lastWrite = now
          let out = ""
          for (let i = 0; i < chars.length; i++) {
            const c = chars[i]
            if (c === " " || el >= (i + 1) * step) out += c
            else out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
          }
          vis.textContent = out
        }
        if (el < total) raf = requestAnimationFrame(tick)
        else vis.textContent = text
      }
      raf = requestAnimationFrame(tick)
    }

    if (trigger === "view") {
      const onReveal = (e: Event) => {
        const detail = (e as CustomEvent<RevealEventDetail>).detail
        if (detail?.instant) return
        timer = setTimeout(run, delay)
      }
      root.addEventListener("rdo:reveal", onReveal)
      return () => {
        root.removeEventListener("rdo:reveal", onReveal)
        clearTimeout(timer)
        cancelAnimationFrame(raf)
        vis.textContent = text
      }
    }

    if (trigger === "intro") {
      if (first.current) {
        first.current = false
        timer = setTimeout(run, introRemaining(delay))
      }
    } else if (trigger === "change") {
      if (prevText.current !== text) timer = setTimeout(run, delay)
    }
    prevText.current = text
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      vis.textContent = text
    }
  }, [text, trigger, delay, duration, reduced])

  return (
    <span
      ref={rootRef}
      className={cn("scramble font-mono", className)}
      data-reveal={trigger === "view" ? "custom" : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" ref={visRef} dangerouslySetInnerHTML={{ __html: escapeHtml(text) }} />
    </span>
  )
}
