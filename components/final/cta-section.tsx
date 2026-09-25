"use client"

import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { ShotList } from "@/components/motion/shot-list"
import { CtaLink } from "@/components/motion/cta-link"
import { SignalField } from "@/components/hero/signal-field"
import { CALENDLY_URL, CALL_EXPECTATIONS, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"

/** STUB (owned by W9). */
export function CtaSection() {
  return (
    <section id="final" aria-labelledby="final-title" className="vignette relative flex min-h-[100svh] items-center overflow-clip py-24">
      <SignalField preset="horizon" />
      <div className="shell relative z-10 text-center">
        <Slate section="final" align="center" />
        <h2 id="final-title" className="mx-auto mt-8 max-w-4xl text-h2 text-balance">
          <SplitText text="Ready for calmer infrastructure and clearer spend?" />
        </h2>
        <Reveal as="p" className="mx-auto mt-6 max-w-2xl text-lede text-paper-dim">
          Tell us where it hurts — cost, reliability, or delivery. Your first consultation is free, and you will leave
          with a concrete next step either way.
        </Reveal>
        <ShotList items={CALL_EXPECTATIONS} size="lg" className="mx-auto mt-10 max-w-xl text-left" />
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaLink href={CALENDLY_URL} variant="primary" size="xl" external magnetic underline lit icon="arrow">
            {PRIMARY_CTA_LABEL}
          </CtaLink>
          <CtaLink href={CONTACT_MAILTO} variant="secondary" size="xl" icon="mail">
            {CONTACT_EMAIL}
          </CtaLink>
        </div>
      </div>
    </section>
  )
}
