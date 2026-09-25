"use client"

import { cn } from "@/lib/utils"
import { useMotionPref } from "@/hooks/use-motion-pref"

export type MotionToggleProps = {
  variant?: "pill" | "inline"
  className?: string
}

/**
 * Per-viewer MOTION on/off. Honoured exactly like prefers-reduced-motion (html[data-motion]) and
 * persisted in localStorage.
 */
export function MotionToggle({ variant = "pill", className }: MotionToggleProps) {
  const { reduced, setReduced } = useMotionPref()
  return (
    <button
      type="button"
      aria-pressed={!reduced}
      aria-label="Motion effects"
      title={reduced ? "Turn motion effects on" : "Turn motion effects off"}
      onClick={() => setReduced(!reduced)}
      className={cn("motion-toggle js-only", variant === "pill" ? "motion-toggle-pill" : "motion-toggle-inline", className)}
    >
      <span className="motion-toggle-dot" aria-hidden="true" />
      <span className="font-mono">MOTION</span>
      <span className="font-mono motion-toggle-state">{reduced ? "OFF" : "ON"}</span>
    </button>
  )
}
