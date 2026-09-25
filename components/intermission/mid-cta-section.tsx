import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { ShotList } from "@/components/motion/shot-list"
import { CtaLink } from "@/components/motion/cta-link"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { cn } from "@/lib/utils"
import { fms } from "@/lib/motion/tokens"
import { CALENDLY_URL, CALL_EXPECTATIONS, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { Dial } from "./dial"
import s from "./intermission.module.css"

const MARQUEE = "INTERMISSION · "
const COPIES = [0, 1, 2, 3] as const

/**
 * Intermission: the first pressure-free ask. Server component; every motion is CSS keyed off the
 * reveal system, so the section ships no JS of its own (CtaLink / ScrambleText are the only islands).
 *
 * Behind the card, an outline "INTERMISSION ·" marquee drifts left (CSS loop, paused offscreen via
 * data-loop, static under still:). In the card: the slate eyebrow scrambles and rules, the H2 rises
 * word by word, the shot list ticks, the 30-minute dial sweeps once and parks its hand at 12 as a
 * playhead, and the secondary CTA strokes its border. The primary CTA never moves: it is the anchor.
 */
export function MidCtaSection() {
  return (
    <section id="intermission" aria-labelledby="mid-cta-heading" className="relative overflow-clip py-20 lg:pt-[11vw]">
      <div aria-hidden="true" data-loop="" className={s.marquee}>
        <div className={s.track}>
          {COPIES.map((i) => (
            <span key={i} className={s.copy}>
              {MARQUEE}
            </span>
          ))}
        </div>
      </div>

      <div className="shell relative z-[1]">
        <div
          className={cn(
            s.card,
            "vf-host relative grid gap-12 rounded-2xl border border-line bg-ink-900/90 p-5 sm:p-8 md:p-12",
            "lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-16 xl:p-14",
          )}
        >
          <ViewfinderFrame />

          <div className="min-w-0">
            <Slate
              section="intermission"
              label="INTERMISSION · FREE 30-MINUTE CONSULT"
              cut={null}
              className={s.eyebrow}
            />
            <h2
              id="mid-cta-heading"
              className="mt-6 max-w-[18ch] text-balance text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] font-[640] leading-[1.02] tracking-[-0.035em] text-paper"
            >
              <SplitText text="See if ReDevOps is the right fit — in one call" delay={fms(3)} />
            </h2>
            <ShotList items={CALL_EXPECTATIONS} className="mt-8 max-w-[52ch]" />
          </div>

          <div className="flex min-w-0 flex-col items-center gap-10 md:flex-row md:gap-12 lg:flex-col lg:gap-10">
            <Dial />
            <div className="flex w-full flex-col gap-3">
              <CtaLink href={CALENDLY_URL} variant="primary" size="lg" external magnetic icon="arrow" className="w-full">
                {PRIMARY_CTA_LABEL}
              </CtaLink>
              <CtaLink href={CONTACT_MAILTO} variant="secondary" size="lg" drawBorder delay={fms(6)} className="w-full">
                Prefer email? Write Recep
              </CtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
