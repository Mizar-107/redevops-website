"use client"

import { Fragment, useEffect, useRef, type CSSProperties, type RefObject } from "react"
import { m, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { Hairline } from "@/components/motion/hairline"
import { ScrambleText } from "@/components/motion/scramble-text"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { CtaLink } from "@/components/motion/cta-link"
import { CALENDLY_URL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { DUR_MS, HERO, fms, staggerFor } from "@/lib/motion/tokens"
import { introRemaining } from "@/lib/motion/pref"
import { clamp, ease } from "@/lib/motion/math"
import { useScrub } from "@/hooks/use-scrub"
import { SignalField } from "./signal-field"
import s from "./hero.module.css"

const SLATE_LABEL = "DEVOPS CONSULTING"
const SLATE_CUT = "Hands-on, not slideware"

const L1_TEXT = "Cut cloud waste."
const L1_WORDS = L1_TEXT.split(" ")
const L1_STEP = staggerFor(L1_WORDS.length, fms(2), 500)
const SLIVER_WORD = L1_WORDS.length - 1

const BLADE_AT = HERO.blade + HERO.bladeHold
const HEAL_AT = BLADE_AT + HERO.bladeSweep + HERO.sliceHold
const HANDBACK_AT = HEAL_AT + HERO.heal

/** Where "confidence." starts on line 2 (fraction of the line) when it sets on one line (≥508px). */
const ACCENT_AT = 0.45
/** Earliest skew start: the cut wipe crawls through its first fifth (reaching 0.2 only at ~40% of its
 *  time), so a word at the start of a line is keyed to where the edge picks up speed and the word
 *  visibly opens, not to t = 0 (the settle would be spent before most of it is uncovered). */
const SKEW_MIN_AT = 0.2

/** Timing vars for hero.module.css, all from lib/motion/tokens.ts. */
const TIMING = {
  "--bl-hold": `${HERO.bladeHold}ms`,
  "--bl-at": `${BLADE_AT}ms`,
  "--bl-dur": `${HERO.bladeSweep}ms`,
  "--bl-heal": `${HEAL_AT}ms`,
  "--bl-end": `${HANDBACK_AT}ms`,
  "--sliver-at": `${Math.round(0.8 * HERO.bladeSweep)}ms`,
  // the skew starts as the wipe edge reaches "confidence.": ~45% in when line 2 sets on one line;
  // at once where it wraps (<508px, the word starts its own line; hero.module.css picks). Refined on mount.
  "--l2-skew-at": `${skewAt(ACCENT_AT)}ms`,
  "--l2-skew-at-wrap": `${skewAt(0)}ms`,
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

/** ms after --hero-t0 at which the "confidence." skew starts, for the word starting at fraction u of
 *  line 2: when the line's wipe (f24, cut) edge reaches it. */
function skewAt(u: number) {
  return Math.round(HERO.line2 + invCut(clamp(u, SKEW_MIN_AT, 1)) * DUR_MS.f24)
}

/**
 * One line-1 glyph run. The real layer holds the text; the clones and the sliver draw the same word
 * from data-text via ::before (s.ghost), so raw HTML / crawlers / copy see "Cut cloud waste." once
 * instead of four times, while the glyph boxes stay identical and registered.
 */
function Glyphs({ word, ghost }: { word: string; ghost?: boolean }) {
  return ghost ? <span className={cn(s.g, s.ghost)} data-text={word} /> : <span className={s.g}>{word}</span>
}

/**
 * Line-1 words. Identical markup for the real layer and both clones (so the slice stays
 * registered); mirrors SplitText's .w/.wi structure so the global intro mask-rise drives all three.
 */
function L1Words({ wordRef, ghost }: { wordRef?: RefObject<HTMLSpanElement | null>; ghost?: boolean }) {
  return (
    <>
      {L1_WORDS.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ "--wd": `${Math.round(HERO.line1 + i * L1_STEP)}ms` } as CSSProperties}>
            <span
              ref={i === SLIVER_WORD ? wordRef : undefined}
              className={cn("wi", i === SLIVER_WORD && s.wordHost)}
            >
              <Glyphs word={w} ghost={ghost} />
              {i === SLIVER_WORD && (
                <span className={cn(s.sliver, "select-none")} aria-hidden="true">
                  <Glyphs word={w} ghost />
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
  const l2Ref = useRef<HTMLSpanElement>(null)

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

  // "confidence." skews −8° → 0 as the wipe edge reaches it. CSS already picks the one-line or the
  // wrapped timing; re-time it from the measured edge for anything in between (font, zoom) — only
  // while the earliest possible skew is still ahead, so a late hydration never restarts one seen.
  useEffect(() => {
    const l2 = l2Ref.current
    const host = l2?.querySelector<HTMLElement>(".wipe-clip")
    const acc = l2?.querySelector<HTMLElement>(".accent")
    if (!l2 || !host || !acc) return
    const run = () => {
      if (introRemaining(skewAt(0)) <= 0) return
      const a = host.getBoundingClientRect()
      const b = acc.getBoundingClientRect()
      if (!a.width) return
      l2.style.setProperty("--l2-skew-at", `${skewAt((b.left - a.left) / a.width)}ms`)
    }
    run()
    document.fonts?.ready.then(run).catch(() => {})
  }, [])

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-labelledby="hero-title"
      className={cn("vignette relative min-h-[100svh] overflow-clip", s.hero)}
    >
      <SignalField preset="hero" progress={progress} avoidRef={h1Ref} bladeRef={l1Ref} horizonRef={horizonRef} />

      <m.div
        className={cn("gutter relative z-10 min-h-[100svh]", s.content, s.scrollOut)}
        style={{ ...TIMING, opacity: fade }}
      >
        <div className={s.slateRow}>
          {/* One slate, the system's format: signal label, dim "· cut" and the rule. Below md the
              cut drops to a second mono line with the rule beside it (s.slate grid); the label wraps
              rather than clipping on ≤340px screens. */}
          <p className={cn("slate", s.slate)}>
            <ScrambleText text={SLATE_LABEL} trigger="intro" className="slate-label" />
            <Reveal as="span" mode="fade" trigger="intro" delay={DUR_MS.f6} className="slate-cut">
              <span className="hidden md:inline">· </span>
              {SLATE_CUT}
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
                <L1Words ghost />
              </span>
              <span aria-hidden="true" className={cn("split", s.clone, s.bot)} data-reveal-intro="mask">
                <L1Words ghost />
              </span>
              <span aria-hidden="true" className={s.blade}>
                <span className={s.trail} />
                <span className={s.head} />
              </span>
            </span>
          </m.span>{" "}
          <span ref={horizonRef} className={s.horizon} data-horizon="" aria-hidden="true" />
          <m.span ref={l2Ref} className={cn("block", s.scrollOut, s.l2)} style={{ y: y2 }}>
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
          {/* custom intro (s.lede): painted from the first frame, faint, then develops and settles at
              its beat, so it is never an opacity-0 LCP candidate waiting on the intro */}
          <Reveal
            as="p"
            mode="custom"
            trigger="intro"
            delay={HERO.lede}
            className={cn(s.lede, "mt-7 max-w-[60ch] text-lede text-paper-dim text-pretty md:mt-8")}
          >
            We help growing product teams spend less on cloud, harden their infrastructure, and ship faster,
            without freezing your roadmap or replacing your engineers.
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
              Email us
            </CtaLink>
          </div>

          <Reveal trigger="intro" delay={HERO.cue} className="mt-8 flex items-center gap-4 md:mt-10">
            <span aria-hidden="true" className={s.cueTrack} data-loop="">
              <span className={s.cueDash} />
            </span>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-hud uppercase text-paper-mute">Scroll to explore</span>
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
