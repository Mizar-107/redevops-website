import { Fragment, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { staggerFor } from "@/lib/motion/tokens"

export type SplitTextProps = {
  text: string
  as?: "span" | "div"
  /** mask: words rise from behind a matte. wipe: clip-path wipe L→R with a gate bar riding the edge. */
  mode?: "mask" | "wipe"
  trigger?: "view" | "intro"
  /** ms */
  delay?: number
  /** ms per word (default 83 = f2); the total is capped at 500ms */
  stagger?: number
  /** substring rendered with the .accent gradient (whole words) */
  accent?: string
  className?: string
  wordClassName?: string
  id?: string
}

/**
 * Server-safe display-type splitter. Deterministic word split at render time (never measured).
 * Accessibility: an sr-only copy carries the real string; the visual split is aria-hidden.
 */
export function SplitText({
  text,
  as: Tag = "span",
  mode = "mask",
  trigger = "view",
  delay = 0,
  stagger = 83,
  accent,
  className,
  wordClassName,
  id,
}: SplitTextProps) {
  const words = text.split(/\s+/).filter(Boolean)
  const st = staggerFor(words.length, stagger, 500)
  const accentWords = new Set<number>()
  if (accent) {
    const aw = accent.split(/\s+/).filter(Boolean)
    for (let i = 0; i + aw.length <= words.length; i++) {
      if (aw.every((w, k) => words[i + k] === w)) {
        aw.forEach((_, k) => accentWords.add(i + k))
        break
      }
    }
  }
  const attrs = trigger === "intro" ? { "data-reveal-intro": mode } : { "data-reveal": mode }
  const rootStyle = { "--sd": `${delay}ms` } as CSSProperties

  const visual = words.map((w, i) => (
    <Fragment key={i}>
      <span className="w" style={{ "--wd": `${Math.round(delay + i * st)}ms` } as CSSProperties}>
        <span className={cn("wi", accentWords.has(i) && "accent", wordClassName)}>{w}</span>
      </span>
      {i < words.length - 1 ? " " : null}
    </Fragment>
  ))

  return (
    <Tag id={id} className={cn("split", mode === "wipe" && "split-wipe", className)} style={rootStyle} {...attrs}>
      <span className="sr-only select-none">{text}</span>
      {mode === "wipe" ? (
        <span aria-hidden="true" className="wipe-host">
          <span className="wipe-clip">{visual}</span>
          <span className="gate" />
        </span>
      ) : (
        <span aria-hidden="true">{visual}</span>
      )}
    </Tag>
  )
}
