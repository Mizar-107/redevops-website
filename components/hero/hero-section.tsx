"use client"

import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { CtaLink } from "@/components/motion/cta-link"
import { CALENDLY_URL, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { SignalField } from "./signal-field"

/** STUB (owned by W3). */
export function HeroSection() {
  return (
    <section id="home" aria-labelledby="hero-title" className="vignette relative min-h-[100svh] overflow-clip">
      <SignalField preset="hero" />
      <div className="gutter relative z-10 flex min-h-[100svh] flex-col justify-center pb-16 pt-[calc(var(--header-h)+10svh)]">
        <Slate section="home" trigger="intro" label="REEL 01 · DEVOPS CONSULTING BY RECEP — HANDS-ON, NOT SLIDEWARE" cut={null} />
        <h1 id="hero-title" className="mt-6 max-w-[62rem] text-display">
          <SplitText as="span" text="Cut cloud waste." trigger="intro" delay={120} className="block" />
          <SplitText as="span" text="Ship with confidence." mode="wipe" trigger="intro" delay={360} accent="confidence." className="block" />
        </h1>
        <Reveal trigger="intro" delay={1200} as="p" className="mt-8 max-w-[60ch] text-lede text-paper-dim text-pretty">
          ReDevOps partners with growing product teams to rightsize spend, harden infrastructure, and speed up delivery —
          without freezing your roadmap or replacing your engineers.
        </Reveal>
        <Reveal trigger="intro" delay={1400} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <CtaLink href={CALENDLY_URL} variant="primary" size="lg" external magnetic icon="arrow">
            {PRIMARY_CTA_LABEL}
          </CtaLink>
          <CtaLink href={CONTACT_MAILTO} variant="secondary" size="lg" icon="mail" drawBorder trigger="intro" delay={1400}>
            Email {CONTACT_EMAIL}
          </CtaLink>
        </Reveal>
        <Reveal trigger="intro" delay={2100} className="mt-8 font-mono text-hud uppercase text-paper-mute">
          Scroll to roll ·{" "}
          <a href="#services" className="text-signal hover:underline">
            See how we work →
          </a>
        </Reveal>
      </div>
    </section>
  )
}
