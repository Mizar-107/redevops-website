import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import s from "./results.module.css"

export type LowerThirdProps = {
  /** 0-based position; renders the OUTCOME 0N tag */
  index: number
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

/**
 * An outcome as a broadcast lower-third. On reveal (CSS only, data-reveal="custom"):
 * the icon strokes on; a signal bar wipes in from the left carrying `OUTCOME 0N` in ink; the title
 * rises out of the bar's top edge through a matte (+f3); a 1px second line slides in (+f6) as the
 * description fades; f6 after the text lands the bar retracts to a 24px stub, uncovering the tag in
 * signal. Cards in a row stagger f4 (CSS works out the column, so single-column mobile never waits).
 */
export function LowerThird({ index, icon: Icon, title, description, className }: LowerThirdProps) {
  const tag = `OUTCOME ${String(index + 1).padStart(2, "0")}`
  return (
    <article
      data-reveal="custom"
      className={cn(s.lt, "vf-host relative flex flex-col rounded-xl border border-line bg-ink-900 p-6", className)}
    >
      <ViewfinderFrame />
      <Icon aria-hidden="true" className={cn(s.ltIcon, "h-5 w-5 text-signal")} strokeWidth={1.5} />

      <div className="mt-6">
        <div className={cn(s.ltMatte, "text-h3-sm sm:flex sm:min-h-[calc(2.5em+8px)] sm:items-end")}>
          <h3 className="text-h3-sm text-paper">
            <span className={s.ltTitle}>{title}</span>
          </h3>
        </div>

        <div className={s.ltBar}>
          <span className={cn(s.ltTag, s.ltTagUnder, "font-mono text-hud uppercase")}>{tag}</span>
          <span aria-hidden="true" className={s.ltBarClip}>
            <span className={cn(s.ltTag, "font-mono text-hud uppercase")}>{tag}</span>
          </span>
        </div>
        <span aria-hidden="true" className={s.ltLineWrap}>
          <span className={s.ltLine} />
        </span>

        <p className={cn(s.ltDesc, "mt-4 text-[0.9375rem] leading-relaxed text-paper-dim")}>{description}</p>
      </div>
    </article>
  )
}
