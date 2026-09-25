"use client"

import { Fragment, useEffect, useRef, type CSSProperties, type RefObject } from "react"
import { m, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { Hairline } from "@/components/motion/hairline"
import { ScrambleText } from "@/components/motion/scramble-text"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { CtaLink } from "@/components/motion/cta-link"
import { CALENDLY_URL, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { section } from "@/lib/sections"
import { DUR_MS, HERO, fms, staggerFor } from "@/lib/motion/tokens"
import { clamp, ease } from "@/lib/motion/math"
import { useScrub } from "@/hooks/use-scrub"
import { SignalField } from "./signal-field"
import s from "./hero.module.css"

const HOME = section("home")
const SLATE_LONG = `REEL ${HOME.reel} · DEVOPS CONSULTING BY RECEP — HANDS-ON, NOT SLIDEWARE`
const SLATE_SHORT = `REEL ${HOME.reel} · DEVOPS CONSULTING BY RECEP`

const L1_TEXT = "Cut cloud waste."
const L1_WORDS = L1_TEXT.split(" ")
const L1_STEP = staggerFor(L1_WORDS.length, fms(2), 500)
const SLIVER_WORD = L1_WORDS.length - 1

const BLADE_AT = HERO.blade + HERO.bladeHold
const HEAL_AT = BLADE_AT + HERO.bladeSweep + HERO.sliceHold
const HANDBACK_AT = HEAL_AT + HERO.heal

/** Timing vars for hero.module.css, all from lib/motion/tokens.ts. */
const TIMING = {
  "--bl-hold": `${HERO.bladeHold}ms`,
  "--bl-at": `${BLADE_AT}ms`,
  "--bl-dur": `${HERO.bladeSweep}ms`,
  "--bl-heal": `${HEAL_AT}ms`,
  "--bl-end": `${HANDBACK_AT}ms`,
  "--sliver-at": `${Math.round(0.8 * HERO.bladeSweep)}ms`,
  "--l2-skew-at": `${HERO.line2 + DUR_MS.f6}ms`,
  "--cta-at": `${HERO.ctas}ms`,
} as CSSProperties

/** Inverse of ease.cut: the linear progress at which the eased blade reaches u. */
function invCut(u: number) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (ease.cut(mid) < u) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Line-1 words. Identical markup for the real layer and both clones (so the slice stays
 * registered); mirrors SplitText's .w/.wi structure so the global intro mask-rise drives all three.
 */
function L1Words({ wordRef }: { wordRef?: RefObject<HTMLSpanElement | null> }) {
  return (
    <>
      {L1_WORDS.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ "--wd": `${Math.round(HERO.line1 + i * L1_STEP)}ms` } as CSSProperties}>
            <span
              ref={i === SLIVER_WORD ? wordRef : undefined}
              className={cn("wi", i === SLIVER_WORD && s.wordHost)}
            >
              <span className={s.g}>{w}</span>
              {i === SLIVER_WORD && (
                <span className={cn(s.sliver, "select-none")} aria-hidden="true">
                  <span className={s.g}>{w}</span>
                </span>
              )}
            </span>
          </span>
          {i < L1_WORDS.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const l1Ref = useRef<HTMLSpanElement>(null)
  const horizonRef = useRef<HTMLSpanElement>(null)
  const wasteRef = useRef<HTMLSpanElement>(null)

  const { progress } = useScrub(sectionRef, ["start start", "end start"])
  const y1 = useTransform(progress, [0, 1], ["0vh", "-12vh"])
  const y2 = useTransform(progress, [0, 1], ["0vh", "-6vh"])
  const fade = useTransform(progress, [0.45, 0.85], [1, 0])

  // The sliver of "waste." falls when the blade crosses the word's centre.
  useEffect(() => {
    const l1 = l1Ref.current
    const word = wasteRef.current
    if (!l1 || !word) return
    const run = () => {
      const a = l1.getBoundingClientRect()
      const b = word.getBoundingClientRect()
      if (!a.width) return
      const u = clamp((b.left + b.width / 2 - a.left) / a.width)
      l1.style.setProperty("--sliver-at", `${Math.round(invCut(u) * HERO.bladeSweep)}ms`)
    }
    run()
    document.fonts?.ready.then(run).catch(() => {})
  }, [])

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-labelledby="hero-title"
      className="vignette relative min-h-[100svh] overflow-clip"
    >
      <SignalField preset="hero" progress={progress} avoidRef={h1Ref} bladeRef={l1Ref} horizonRef={horizonRef} />

      <m.div
        className={cn("gutter relative z-10 min-h-[100svh]", s.content, s.scrollOut)}
        style={{ ...TIMING, opacity: fade }}
      >
        <div className={s.slateRow}>
          <p className="slate">
            <ScrambleText text={SLATE_LONG} trigger="intro" className="slate-label hidden md:inline" />
            <ScrambleText text={SLATE_SHORT} trigger="intro" className="slate-label whitespace-nowrap md:hidden" />
            <Hairline draw="start" trigger="intro" delay={DUR_MS.f6} className="slate-rule hidden md:block" />
          </p>
          {/* <md: the cut clause becomes a second mono line, and the rule moves down with it */}
          <p className="slate mt-2 md:hidden">
            <Reveal as="span" mode="fade" trigger="intro" delay={DUR_MS.f6} className="whitespace-nowrap">
              Hands-on, not slideware
            </Reveal>
            <Hairline draw="start" trigger="intro" delay={DUR_MS.f6} className="slate-rule" />
          </p>
        </div>

        <h1 id="hero-title" ref={h1Ref} className={cn("text-display", s.title)}>
          <m.span className={cn("block", s.scrollOut)} style={{ y: y1 }}>
            <span ref={l1Ref} className={s.l1}>
              <span className={cn("split", s.layer, s.real)} data-reveal-intro="mask">
                <span className="sr-only select-none">{L1_TEXT}</span>
                <span aria-hidden="true">
                  <L1Words wordRef={wasteRef} />
                </span>
              </span>
              <span aria-hidden="true" className={cn("split", s.clone, s.top)} data-reveal-intro="mask">
                <L1Words />
              </span>
              <span aria-hidden="true" className={cn("split", s.clone, s.bot)} data-reveal-intro="mask">
                <L1Words />
              </span>
              <span aria-hidden="true" className={s.blade}>
                <span className={s.trail} />
                <span className={s.head} />
              </span>
            </span>
          </m.span>{" "}
          <span ref={horizonRef} className={s.horizon} data-horizon="" aria-hidden="true" />
          <m.span className={cn("block", s.scrollOut, s.l2)} style={{ y: y2 }}>
            <SplitText
              as="span"
              text="Ship with confidence."
              mode="wipe"
              trigger="intro"
              delay={HERO.line2}
              accent="confidence."
              className="block"
            />
          </m.span>
        </h1>

        <div className="max-w-[62rem]">
          <Reveal
            as="p"
            trigger="intro"
            delay={HERO.lede}
            className="mt-7 max-w-[60ch] text-lede text-paper-dim text-pretty md:mt-8"
          >
            ReDevOps partners with growing product teams to rightsize spend, harden infrastructure, and speed up
            delivery — without freezing your roadmap or replacing your engineers.
          </Reveal>

          <div className={cn(s.ctas, "mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-9")}>
            <CtaLink href={CALENDLY_URL} variant="primary" size="lg" external magnetic icon="arrow">
              {PRIMARY_CTA_LABEL}
            </CtaLink>
            <CtaLink
              href={CONTACT_MAILTO}
              variant="secondary"
              size="lg"
              icon="mail"
              drawBorder
              trigger="intro"
              delay={HERO.ctas}
            >
              Email {CONTACT_EMAIL}
            </CtaLink>
          </div>

          <Reveal trigger="intro" delay={HERO.cue} className="mt-8 flex items-center gap-4 md:mt-10">
            <span aria-hidden="true" className={s.cueTrack} data-loop="">
              <span className={s.cueDash} />
            </span>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-hud uppercase text-paper-mute">Scroll to roll</span>
              <a
                href="#services"
                className="inline-flex min-h-[44px] items-center text-sm text-paper-dim transition-colors duration-f6 hover:text-signal"
              >
                See how we work →
              </a>
            </p>
          </Reveal>
        </div>
      </m.div>
    </section>
  )
}
