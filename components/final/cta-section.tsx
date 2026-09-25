"use client"

import { Fragment, useCallback, useRef, useState, type CSSProperties } from "react"
import { flushSync } from "react-dom"
import { cn } from "@/lib/utils"
import { staggerFor } from "@/lib/motion/tokens"
import { useScrub } from "@/hooks/use-scrub"
import { Slate } from "@/components/motion/slate"
import { Reveal } from "@/components/motion/reveal"
import { ShotList } from "@/components/motion/shot-list"
import { CtaLink } from "@/components/motion/cta-link"
import { SignalField } from "@/components/hero/signal-field"
import { CALENDLY_URL, CALL_EXPECTATIONS, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { CalmerWord } from "./calmer-word"
import { RecapSting } from "./recap-sting"
import { CopyEmail } from "./copy-email"
import s from "./final.module.css"

const TITLE = "Ready for calmer infrastructure and clearer spend?"
const WORDS = TITLE.split(" ")
const WORD_STEP = staggerFor(WORDS.length, 83, 500)

/**
 * REEL 06 · FINAL CUT. The calm horizon field (the inverse of the hero's chaos) unfolds from the FAQ
 * seam as the section enters; a recap sting cuts through the four service motifs, collapses them to
 * the throughline and hands it to the booking button, whose underline lights. "calmer" settles from
 * jitter. Stillest frame on the page after the notice card: the moment the underline lights.
 */
export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLSpanElement>(null)
  const ctaRowRef = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(false)
  const { progress: entry } = useScrub(sectionRef, ["start end", "start start"])

  const land = useCallback((sync: boolean) => {
    if (sync) flushSync(() => setLit(true))
    else setLit(true)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="final"
      aria-labelledby="final-title"
      className="vignette relative flex min-h-[100svh] items-center overflow-clip py-24 md:py-28"
    >
      <SignalField preset="horizon" progress={entry} avoidRef={contentRef} />
      <div aria-hidden="true" className={s.scrim} />
      <span ref={sentinelRef} aria-hidden="true" data-reveal="custom" className={s.sentinel} />

      <div className="shell relative z-10">
        <div ref={contentRef} className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <Slate section="final" align="center" className={cn("w-full max-w-xl", s.slateFit)} />

          <RecapSting sentinelRef={sentinelRef} targetRef={ctaRowRef} onLand={land} className="mt-9" />

          <h2 id="final-title" className="mt-9 max-w-[15ch] text-h2 text-balance sm:max-w-[18ch] lg:max-w-none">
            <span className="split" data-reveal="mask">
              <span className="sr-only">{TITLE}</span>
              <span aria-hidden="true">
                {WORDS.map((w, i) => (
                  <Fragment key={i}>
                    <span
                      className={cn("w", w === "calmer" && s.calmerW)}
                      style={{ "--wd": `${Math.round(i * WORD_STEP)}ms` } as CSSProperties}
                    >
                      <span className="wi">{w === "calmer" ? <CalmerWord /> : w}</span>
                    </span>
                    {i < WORDS.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
            </span>
          </h2>

          <Reveal as="p" delay={120} className="mt-6 max-w-2xl text-lede text-paper-dim text-pretty">
            Tell us where it hurts — cost, reliability, or delivery. Your first consultation is free, and you will leave
            with a concrete next step either way.
          </Reveal>

          <ShotList items={CALL_EXPECTATIONS} size="lg" className="mt-9 w-full max-w-xl text-left" />

          <div
            ref={ctaRowRef}
            data-reveal="rise"
            style={{ "--d": "83ms" } as CSSProperties}
            className="mt-11 flex w-full max-w-md flex-col items-stretch gap-6 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3"
          >
            <CtaLink
              href={CALENDLY_URL}
              variant="primary"
              size="xl"
              external
              magnetic
              underline
              lit={lit}
              icon="arrow"
              className={s.book}
            >
              {PRIMARY_CTA_LABEL}
            </CtaLink>
            <div className="flex gap-3">
              <CtaLink
                id="final-email"
                href={CONTACT_MAILTO}
                variant="secondary"
                size="xl"
                icon="mail"
                className="min-w-0 flex-1 sm:flex-none"
              >
                {CONTACT_EMAIL}
              </CtaLink>
              <CopyEmail selectTargetId="final-email" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
