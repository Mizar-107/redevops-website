import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type ViewfinderFrameProps = {
  /** px outside the host box (default 6) */
  inset?: number
  /** px arm length (default 10) */
  arm?: number
  /** show permanently instead of on hover/focus */
  always?: boolean
  className?: string
}

/**
 * Four viewfinder corner brackets. The host must have className="vf-host relative"; the corners must
 * be its direct children. They slide in on hover (fine pointers), on :focus-visible and when a
 * descendant has :focus-visible.
 */
export function ViewfinderFrame({ inset, arm, always, className }: ViewfinderFrameProps) {
  const style: Record<string, string> = {}
  if (inset != null) style["--vf-inset"] = `${inset}px`
  if (arm != null) style["--vf-arm"] = `${arm}px`
  const c = cn("vf-c", always && "vf-on", className)
  return (
    <>
      <span aria-hidden="true" className={cn(c, "vf-tl")} style={style as CSSProperties} />
      <span aria-hidden="true" className={cn(c, "vf-tr")} style={style as CSSProperties} />
      <span aria-hidden="true" className={cn(c, "vf-bl")} style={style as CSSProperties} />
      <span aria-hidden="true" className={cn(c, "vf-br")} style={style as CSSProperties} />
    </>
  )
}
