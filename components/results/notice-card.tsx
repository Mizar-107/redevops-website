import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Hairline } from "@/components/motion/hairline"
import s from "./results.module.css"

const LABEL = "A NOTE BEFORE THE FEATURE"
const TEXT =
  "We measure success by operational clarity and sustainable improvements — not vanity dashboards or inflated percentages."

/** ms offsets inside the notice (from its reveal). Film frames: f3 = 125, f9 = 375, f18 = 750, f21 = 875. */
const AT = { rule1: 0, rule2: 125, label: 375, text: 500, rule3: 750, rule4: 875 } as const

/**
 * The notice card: the honesty beat, and the stillest frame on the page.
 * One data-reveal="custom" block drives a single directed entrance (top double rule draws L→R, the
 * label tracks in, the statement fades up in place, the bottom double rule closes R→L), then
 * nothing ever moves again. Server component; all motion is CSS; SSR/no-JS/reduced = final frame.
 */
export function NoticeCard({ className }: { className?: string }) {
  const chars = Array.from(LABEL)
  const center = (chars.length - 1) / 2
  // Hairline draw="none" pins transform-origin to centre inline; the notice rules draw from an edge
  const at = (ms: number, from: "left" | "right" = "left") =>
    ({ "--at": `${ms}ms`, transformOrigin: `${from} center` }) as CSSProperties
  return (
    <div data-reveal="custom" className={cn(s.notice, className)}>
      <div aria-hidden="true">
        <Hairline draw="none" className={s.noticeRule} style={at(AT.rule1)} />
        <Hairline draw="none" glow={false} className={cn(s.noticeRule, s.noticeRuleSoft, "mt-[6px]")} style={at(AT.rule2)} />
      </div>

      <div className="px-2 py-14 text-center">
        <p className={cn(s.noticeLabel, "font-mono text-slate uppercase text-paper-mute")}>
          <span className="sr-only select-none">{LABEL}</span>
          <span aria-hidden="true" className={s.track}>
            {chars.map((c, i) => (
              <span key={i} className={s.ch} style={{ "--o": (i - center).toFixed(1) } as CSSProperties}>
                {c === " " ? " " : c}
              </span>
            ))}
          </span>
        </p>
        <p
          className={cn(
            s.noticeText,
            "mx-auto mt-7 max-w-[40ch] text-balance text-[clamp(1.25rem,2.2vw,1.75rem)] font-medium leading-[1.35] tracking-[-0.015em] text-paper",
          )}
          style={at(AT.text)}
        >
          {TEXT}
        </p>
      </div>

      <div aria-hidden="true">
        <Hairline
          draw="none"
          glow={false}
          className={cn(s.noticeRule, s.noticeRuleSoft)}
          style={at(AT.rule4, "right")}
        />
        <Hairline draw="none" className={cn(s.noticeRule, "mt-[6px]")} style={at(AT.rule3, "right")} />
      </div>
    </div>
  )
}
