"use client"

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { m, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { NAV, type SectionId } from "@/lib/sections"
import { CALENDLY_URL, CONTACT_MAILTO, PRIMARY_CTA_LABEL_SHORT } from "@/lib/contact"
import { COLD_OPEN, DUR_MS, SPRING } from "@/lib/motion/tokens"
import { CtaLink } from "@/components/motion/cta-link"
import { useChrome } from "@/components/motion/motion-provider"
import { useActiveSection } from "@/hooks/use-active-section"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { LogoMark } from "./logo-mark"
import { MobileMenu } from "./mobile-menu"

/*
 * Header states are HTML attributes written imperatively (never per-frame React renders):
 *   [data-scrolled]   scrollY > 24 (one passive listener; flips only at the threshold)
 *   [data-letterbox]  useChrome().letterbox > .5 (the Services reel's 2.39:1 bars are engaged)
 *
 * The header box is always 64px and fixed (zero layout impact). "64 → 56" is done with compositor
 * properties only: the backdrop layer clips its bottom 8px (clip-path also clips hit-testing), the
 * content row rides up 4px and the film strip slides up into the new bottom edge.
 *
 * Entrance (intro-timed from --hero-t0, CSS only; re-based on the header in play mode, see
 * HDR_T0_PLAY): logo mark + wordmark mask-rise at 0, nav items rise at 120ms + i·f2, Email at
 * 320ms, the primary CTA last at 320ms + f2.
 */
const SCROLLED_AT = 24

/* Play mode: the cold open's top bar covers the header row until its exit (COLD_OPEN.exit, f4
 * expo-in), so an entrance timed from the hero's t0 (700ms) would finish unseen and the header would
 * simply be uncovered. The header gets its own origin: f3 into the exit, as the bar's leading edge
 * clears the 64px row (≈1385–1435ms from 1280×720 to 390×844), so the logo rises in behind the
 * departing bar and the nav / CTAs stagger in view. Seen / skip visits keep the shared --hero-t0. */
const HDR_T0_PLAY = COLD_OPEN.exit[0] + DUR_MS.f3

/* No JS: nothing sets [data-scrolled], so the backplate is on by default (content must never print
 * through the nav). Where CSS scroll timelines exist it still fades in over the same first 24px of
 * scroll, so the top-of-page state matches the JS header. */
const HEADER_CSS = `
.hdr-bg{position:absolute;inset:0;opacity:0;pointer-events:none;background:rgba(5,6,10,.8);clip-path:inset(0 0 0 0);transition:opacity var(--f6) var(--ease-ui),clip-path var(--f6) var(--ease-ui)}
.hdr[data-scrolled] .hdr-bg{opacity:1;pointer-events:auto;clip-path:inset(0 0 8px 0);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.hdr[data-letterbox] .hdr-bg{-webkit-backdrop-filter:none;backdrop-filter:none}
html:not(.js) .hdr-bg{opacity:1;pointer-events:auto;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
@supports (animation-timeline:scroll()){html:not(.js) .hdr-bg{animation:hdr-nojs-bg linear both;animation-timeline:scroll(root block);animation-range:0 ${SCROLLED_AT}px}}
@keyframes hdr-nojs-bg{from{opacity:0}to{opacity:1}}
.hdr-solid{position:absolute;inset:0 0 8px 0;background:var(--ink-950);opacity:0;pointer-events:none;transition:opacity var(--f6) var(--ease-ui)}
.hdr[data-letterbox] .hdr-solid{opacity:1}

.hdr-strip{position:absolute;left:0;right:0;top:48px;height:8px;pointer-events:none;opacity:0;transform:translateY(8px);overflow-x:clip;overflow-y:visible;transition:opacity var(--f6) var(--ease-ui),transform var(--f6) var(--ease-ui)}
.hdr[data-scrolled] .hdr-strip{opacity:1;transform:none}
.hdr[data-scrolled][data-letterbox] .hdr-strip{opacity:0}
.hdr-sprockets{position:absolute;left:-9px;right:0;top:2px;height:2px;background:repeating-linear-gradient(90deg,rgba(236,239,244,.08) 0 3px,transparent 3px 9px)}
.hdr-base{position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--line)}
.hdr-fill{position:absolute;left:0;right:0;bottom:0;height:1px;transform-origin:0 50%}
.hdr-head{position:absolute;inset:0}
.hdr-head::before{content:"";position:absolute;left:-48px;bottom:0;width:48px;height:1px;background:linear-gradient(90deg,rgba(124,244,255,0),var(--signal-hot))}
.hdr-head::after{content:"";position:absolute;left:-1px;bottom:0;width:1px;height:7px;background:var(--signal-hot);box-shadow:0 0 8px rgba(124,244,255,.8)}

.hdr-row{position:relative;height:100%;pointer-events:none;transition:transform var(--f6) var(--ease-ui)}
.hdr-row>*{pointer-events:auto}
.hdr[data-scrolled] .hdr-row{transform:translateY(-4px)}

/* header CTAs keep one line at every width (the <640px CTA wrap is for long labels in page copy) */
.hdr .cta{white-space:nowrap;padding-block:0}
.hdr .cta-text{overflow-wrap:normal}
html[data-intro="play"]:not([data-intro-done]) .hdr{--hero-t0:${HDR_T0_PLAY}ms}
.hdr-mask{display:inline-block;overflow:clip;padding:0 .04em .14em;margin:0 -.04em -.14em;vertical-align:top}
.hdr-mask-i{display:inline-block}
html[data-motion="full"] .hdr-mask-i{animation:rdo-mask var(--f12) var(--ease-title) var(--hero-t0,0ms) both}

.hdr-link{position:relative;display:flex;align-items:center;height:44px;padding:0 .25rem;border-radius:4px;text-decoration:none;white-space:nowrap}
.hdr-link-in{display:flex;align-items:baseline;gap:.5rem}
.hdr-num{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:.625rem;line-height:1.2;letter-spacing:.14em;font-weight:500;color:var(--paper-mute);font-feature-settings:"tnum" 1,"zero" 1;transition:color 150ms linear}
.hdr-label{font-size:.875rem;line-height:1.2;color:var(--paper-dim);transition:color 150ms linear}
@media (hover:hover) and (pointer:fine){.hdr-link:hover .hdr-label{color:var(--paper)}}
.hdr-link:focus-visible .hdr-label{color:var(--paper)}
.hdr-link[aria-current] .hdr-label{color:var(--paper)}
.hdr-link[aria-current] .hdr-num{color:var(--signal)}

.hdr-list{position:relative}
.hdr-ph{position:absolute;left:0;bottom:7px;width:100px;height:2px;pointer-events:none;transform-origin:0 50%}
.hdr-ph-line{position:absolute;inset:0;background:var(--signal);box-shadow:0 0 12px rgba(34,211,238,.35);transform-origin:0 50%;transition:transform var(--f9) var(--ease-title),opacity var(--f6) linear}
.hdr-ph[data-off] .hdr-ph-line{transform:scaleX(0);opacity:0;transition:transform var(--f6) var(--ease-exit),opacity var(--f6) linear}
.hdr-ph-head{position:absolute;left:-2px;bottom:5px;width:5px;height:6px;pointer-events:none}
.hdr-ph-head>i{position:absolute;inset:0;border-style:solid;border-width:3px 0 3px 5px;border-color:transparent transparent transparent var(--signal-hot);transform-origin:0 50%;transition:opacity var(--f6) linear,transform var(--f6) var(--ease-exit)}
.hdr-ph-head[data-off]>i{opacity:0;transform:scale(0)}
html[data-motion="full"] .hdr-ph[data-enter] .hdr-ph-line{animation:rdo-draw-x var(--f9) var(--ease-title) backwards}
@keyframes hdr-ph-pop{from{transform:scale(0)}}
html[data-motion="full"] .hdr-ph-head[data-enter]>i{animation:hdr-ph-pop var(--f9) var(--spring-clap) backwards}

@media (forced-colors:active){
  .hdr-strip,.hdr-ph-head{display:none}
  .hdr[data-scrolled] .hdr-bg,html:not(.js) .hdr-bg{background:Canvas;border-bottom:1px solid CanvasText}
  .hdr-ph-line{forced-color-adjust:none;background:Highlight;box-shadow:none}
}
`

const NAV_IDS = new Set<SectionId>(NAV.map((n) => n.id))

/** Where the nav playhead is parked. `epoch` bumps when it returns from a non-nav section, which
 *  re-keys it (it draws in place instead of sliding from a stale position). */
type Playhead = { id: SectionId; epoch: number; enter: boolean; on: boolean }

function nextPlayhead(ph: Playhead | null, active: SectionId): Playhead | null {
  if (NAV_IDS.has(active)) {
    if (!ph) return { id: active, epoch: 0, enter: true, on: true }
    if (ph.id !== active)
      return ph.on
        ? { id: active, epoch: ph.epoch, enter: false, on: true } // slide link → link
        : { id: active, epoch: ph.epoch + 1, enter: true, on: true } // re-enter: draw in place
    return ph.on ? ph : { ...ph, on: true }
  }
  return ph && ph.on ? { ...ph, on: false } : ph
}

function NavLinks({ active, reduced }: { active: SectionId; reduced: boolean }) {
  const [ph, setPh] = useState<Playhead | null>(null)
  const next = nextPlayhead(ph, active)
  if (next !== ph) setPh(next) // derived state; re-renders only on section boundaries

  // One playhead for the whole nav: x / scaleX (of a 100px base) follow the parked link on the
  // SPRING.hud spring. Measured from the DOM, so no layout-projection engine is needed.
  const listRef = useRef<HTMLUListElement>(null)
  const x = useSpring(0, SPRING.hud)
  const sx = useSpring(0, SPRING.hud)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || !next) return
    const place = (instant: boolean) => {
      const link = list.querySelector<HTMLElement>(`a[href="#${next.id}"]`)
      if (!link) return
      const lr = list.getBoundingClientRect()
      const r = link.getBoundingClientRect()
      // the line spans the link's inner box (0.25rem padding either side)
      const pad = 4
      const tx = r.left - lr.left + pad
      const ts = Math.max(0, r.width - pad * 2) / 100
      if (instant) {
        x.jump(tx)
        sx.jump(ts)
      } else {
        x.set(tx)
        sx.set(ts)
      }
    }
    place(reduced || next.enter || !placed.current)
    placed.current = true
    const ro = new ResizeObserver(() => place(true))
    ro.observe(list)
    return () => ro.disconnect()
  }, [next, reduced, x, sx])

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul ref={listRef} className="hdr-list flex items-center gap-3 lg:gap-7">
        {NAV.map((l, i) => {
          const current = active === l.id
          return (
            <li
              key={l.href}
              data-reveal-intro="rise"
              style={{ "--d": "120ms", "--i": i, "--st": "83ms" } as CSSProperties}
            >
              <a href={l.href} className="hdr-link" aria-current={current ? "location" : undefined}>
                <span className="hdr-link-in">
                  <span className="hdr-num" aria-hidden="true">{l.num}</span>
                  <span className="hdr-label">{l.label}</span>
                </span>
              </a>
            </li>
          )
        })}
        {next && (
          <li aria-hidden="true" className="contents">
            <m.span
              key={`line-${next.epoch}`}
              className="hdr-ph"
              style={{ x, scaleX: sx }}
              data-enter={next.enter ? "" : undefined}
              data-off={next.on ? undefined : ""}
            >
              <span className="hdr-ph-line" />
            </m.span>
            <m.span
              key={`head-${next.epoch}`}
              className="hdr-ph-head"
              style={{ x }}
              data-enter={next.enter ? "" : undefined}
              data-off={next.on ? undefined : ""}
            >
              <i />
            </m.span>
          </li>
        )}
      </ul>
    </nav>
  )
}

/** Film-strip progress along the header's bottom edge: 1px base, sprung signal fill with a
 *  playhead tick, and a sprocket row that advances with the scroll (film through the gate). */
function FilmStrip({ reduced }: { reduced: boolean }) {
  const { scrollY, scrollYProgress } = useScroll()
  const sprung = useSpring(scrollYProgress, SPRING.hud)
  const toPct = (v: number) => `${(v * 100).toFixed(3)}%`
  const headSprung = useTransform(sprung, toPct)
  const headRaw = useTransform(scrollYProgress, toPct)
  const sprockets = useTransform(scrollY, (y) => -((Math.max(0, y) * 0.25) % 9))

  return (
    <div className="hdr-strip" aria-hidden="true">
      <m.span className="hdr-sprockets" style={{ x: reduced ? 0 : sprockets }} />
      <span className="hdr-base" />
      <m.span className="hdr-fill hairline" style={{ scaleX: reduced ? scrollYProgress : sprung }} />
      <m.span className="hdr-head" style={{ x: reduced ? headRaw : headSprung }} />
    </div>
  )
}

/**
 * Fixed site header. Never hides (also not during the pinned stages); the primary CTA is visible at
 * every scroll position. Desktop anchors are plain links (CSS smooth scroll + scroll-padding-top).
 */
export function Header() {
  const ref = useRef<HTMLElement>(null)
  const active = useActiveSection()
  const reduced = useReducedMotionSafe()
  const { letterbox } = useChrome()

  // scrolled state: one passive listener, attribute flips only when the threshold is crossed
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cur: boolean | null = null
    const check = () => {
      const s = window.scrollY > SCROLLED_AT
      if (s === cur) return
      cur = s
      el.toggleAttribute("data-scrolled", s)
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  // letterbox sync: merge into the reel's top bar while the 2.39:1 bars are engaged
  const syncLetterbox = (v: number) => {
    const el = ref.current
    const on = v > 0.5
    if (el && el.hasAttribute("data-letterbox") !== on) el.toggleAttribute("data-letterbox", on)
  }
  useMotionValueEvent(letterbox, "change", syncLetterbox)
  useEffect(() => {
    syncLetterbox(letterbox.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterbox])

  return (
    <m.header
      ref={ref}
      layoutRoot
      className="hdr pointer-events-none fixed inset-x-0 top-0 z-50 h-16"
    >
      <style href="rdo-header" precedence="medium">
        {HEADER_CSS}
      </style>
      <div className="hdr-bg" aria-hidden="true" />
      <div className="hdr-solid" aria-hidden="true" />
      <FilmStrip reduced={reduced} />

      <div className="hdr-row shell grid grid-cols-[1fr_auto_1fr] items-center md:gap-x-3 lg:gap-x-8">
        <a
          href="#home"
          className="lm-host flex h-11 items-center gap-2 justify-self-start rounded-md text-base font-semibold tracking-[-0.02em] text-paper sm:gap-2.5 sm:text-[1.0625rem]"
        >
          <LogoMark animate />
          <span className="hdr-mask max-[359px]:sr-only">
            <span className="hdr-mask-i">
              Re<span className="text-signal">Dev</span>Ops
            </span>
          </span>
        </a>

        <NavLinks active={active} reduced={reduced} />

        <div className="col-start-3 flex items-center gap-2 justify-self-end lg:gap-3">
          <span
            data-reveal-intro="rise"
            style={{ "--d": "320ms" } as CSSProperties}
            className="hidden md:inline-flex"
          >
            <CtaLink
              href={CONTACT_MAILTO}
              variant="ghost"
              size="sm"
              icon="mail"
              aria-label="Email"
              className="max-lg:px-2 max-lg:[&_.cta-text]:sr-only"
            >
              Email
            </CtaLink>
          </span>
          <span data-reveal-intro="rise" style={{ "--d": "403ms" } as CSSProperties} className="inline-flex">
            <CtaLink
              href={CALENDLY_URL}
              variant="primary"
              size="sm"
              external
              magnetic
              className={cn("max-md:min-h-10 max-md:px-3")}
            >
              {PRIMARY_CTA_LABEL_SHORT}
            </CtaLink>
          </span>
          <span data-reveal-intro="rise" style={{ "--d": "486ms" } as CSSProperties} className="inline-flex md:hidden">
            <MobileMenu active={active} />
          </span>
        </div>
      </div>
    </m.header>
  )
}
