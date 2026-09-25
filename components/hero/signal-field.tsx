"use client"

import type { RefObject } from "react"
import type { MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { SignalPoster } from "./signal-poster"

export type SignalFieldProps = {
  preset: "hero" | "horizon"
  /** hero: scroll-out 0..1 ; horizon: entry 0..1 */
  progress?: MotionValue<number>
  /** text rect to attenuate lines behind */
  avoidRef?: RefObject<HTMLElement | null>
  /** hero only: element carrying the blade-sweep CSS animation */
  bladeRef?: RefObject<HTMLElement | null>
  /** element whose vertical centre is the streak row */
  horizonRef?: RefObject<HTMLElement | null>
  className?: string
}

/** STUB (owned by W3): renders the poster only. */
export function SignalField({ preset, className }: SignalFieldProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <SignalPoster preset={preset} />
    </div>
  )
}
