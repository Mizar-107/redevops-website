"use client"

import { SplitText } from "@/components/motion/split-text"
import { ScrambleText } from "@/components/motion/scramble-text"
import { ShotList } from "@/components/motion/shot-list"
import { CtaLink } from "@/components/motion/cta-link"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { CALENDLY_URL, CALL_EXPECTATIONS, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"

/** STUB (owned by W8). */
export function MidCtaSection() {
  return (
    <section id="intermission" aria-labelledby="mid-cta-heading" className="relative overflow-clip py-20">
      <div className="shell">
        <div className="vf-host relative grid gap-10 rounded-2xl border border-line bg-ink-900/90 p-8 md:p-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <ViewfinderFrame />
          <div>
            <p className="slate">
              <ScrambleText text="INTERMISSION · FREE 30-MINUTE CONSULT" className="slate-label" />
            </p>
            <h2 id="mid-cta-heading" className="mt-5 text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-semibold leading-tight tracking-[-0.03em] text-balance">
              <SplitText text="See if ReDevOps is the right fit — in one call" />
            </h2>
            <ShotList items={CALL_EXPECTATIONS} className="mt-8" />
          </div>
          <div className="flex flex-col gap-3">
            <CtaLink href={CALENDLY_URL} variant="primary" size="lg" external magnetic icon="arrow">
              {PRIMARY_CTA_LABEL}
            </CtaLink>
            <CtaLink href={CONTACT_MAILTO} variant="secondary" size="lg" drawBorder>
              Prefer email? Write Recep
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  )
}
