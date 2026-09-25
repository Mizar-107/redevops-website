import { cn } from "@/lib/utils"
import { sectionLabel, section, type SectionId } from "@/lib/sections"
import { ScrambleText } from "./scramble-text"
import { Hairline } from "./hairline"

export type SlateProps = {
  section: SectionId
  align?: "start" | "center"
  trigger?: "view" | "intro"
  /** override the scrambled label (default "01 / SERVICES") */
  label?: string
  /** override the dim md+ cut label; null hides it (default "— The work") */
  cut?: string | null
  /** ms */
  delay?: number
  className?: string
}

/**
 * Section eyebrow: mono index label (decodes in), a dim secondary label at md+, and a hairline rule
 * that finishes f4 after the label. Server-safe.
 */
export function Slate({ section: id, align = "start", trigger = "view", label, cut, delay = 0, className }: SlateProps) {
  const s = section(id)
  const cutText = cut === undefined ? s.cut : cut
  const text = label ?? sectionLabel(id)
  const ruleDelay = delay + 250
  return (
    <p className={cn("slate", align === "center" && "slate-center", className)}>
      {align === "center" && (
        <Hairline draw="end" trigger={trigger} delay={ruleDelay} className="slate-rule" />
      )}
      <ScrambleText text={text} trigger={trigger} delay={delay} className="slate-label" />
      {cutText ? <span className="slate-cut hidden md:inline">· {cutText}</span> : null}
      <Hairline draw="start" trigger={trigger} delay={ruleDelay} className="slate-rule" />
    </p>
  )
}
