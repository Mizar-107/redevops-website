import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type HairlineProps = {
  orientation?: "x" | "y"
  /** where the draw grows from; "none" renders it static */
  draw?: "start" | "center" | "end" | "none"
  trigger?: "view" | "intro"
  /** ms */
  delay?: number
  /** default true */
  glow?: boolean
  className?: string
  style?: CSSProperties
}

const ORIGIN = {
  x: { start: "left center", center: "center", end: "right center", none: "center" },
  y: { start: "center top", center: "center", end: "center bottom", none: "center" },
} as const

/**
 * The Throughline token: 1px of cyan light. Every seam, slate rule, letterbox edge and underline uses
 * this so the line looks identical everywhere. Server-safe, aria-hidden.
 */
export function Hairline({
  orientation = "x",
  draw = "start",
  trigger = "view",
  delay,
  glow = true,
  className,
  style,
}: HairlineProps) {
  const attrs =
    draw === "none" ? {} : trigger === "intro" ? { "data-reveal-intro": "draw" } : { "data-reveal": "draw" }
  const vars: Record<string, string> = { transformOrigin: ORIGIN[orientation][draw] }
  if (delay != null) vars["--d"] = `${delay}ms`
  return (
    <span
      aria-hidden="true"
      className={cn("hairline", orientation === "y" ? "hairline-y is-y" : "hairline-x", !glow && "hairline-flat", className)}
      style={{ ...vars, ...style } as CSSProperties}
      {...attrs}
    />
  )
}
