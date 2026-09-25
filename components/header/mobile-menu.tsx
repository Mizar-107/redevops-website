"use client"

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { NAV, reelLabel, type SectionId } from "@/lib/sections"
import { CALENDLY_URL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { CtaLink } from "@/components/motion/cta-link"
import { Hairline } from "@/components/motion/hairline"
import { MotionToggle } from "@/components/motion/motion-toggle"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { LogoMark } from "./logo-mark"

/*
 * Curtain menu. Radix Dialog directly (focus trap, Esc, focus return, scroll lock via the Overlay).
 * Radix Presence waits for `animationend` on the content node, so open/close are CSS keyframes
 * (not transitions) with different names per data-state. Everything motion-related is gated on
 * html[data-motion="full"]; under reduced motion the panel simply appears / disappears.
 *
 * Choreography (open):  0      curtain clip inset(0 0 100% 0) → inset(0), f12 cut; a throughline
 *                              hairline rides the curtain's leading edge, then fades (f6)
 *                       f3     ≡ → × (f9 title)
 *                       f6+i·f3  row i: label mask-rises (f12 title), its rule draws (f12 cut)
 *                       f6+(4+k)·f3  CTA, email, MOTION rise (f12 title)
 * Close: the curtain reverses over f9 exit with the edge riding it back up. Not staggered.
 * Once every open animation has finished the panel is marked [data-settled], which removes them, so
 * turning MOTION on from inside the open menu cannot replay the entrance.
 */
const MENU_CSS = `
.mm-burger{position:relative;display:inline-grid;place-items:center;width:44px;height:44px;flex:none;border-radius:10px;border:1px solid var(--line-strong);background:rgba(5,6,10,.4);color:var(--paper);transition:border-color 150ms linear}
.mm-bars{position:relative;display:block;width:18px;height:9px}
.mm-bars i{position:absolute;right:0;width:18px;height:1.5px;border-radius:1px;background:currentColor;transform-origin:100% 50%;transition:transform var(--f6) var(--ease-title)}
.mm-bars i:first-child{top:0}
.mm-bars i:last-child{bottom:0;transform:scaleX(.62)}
@media (hover:hover) and (pointer:fine){
  .mm-burger:hover{border-color:rgba(34,211,238,.6)}
  .mm-burger:hover .mm-bars i:last-child{transform:none}
  .mm-link:hover .mm-label{color:var(--signal)}
}
.mm-x{position:relative;display:block;width:18px;height:18px}
.mm-x i{position:absolute;left:0;top:50%;width:18px;height:1.5px;margin-top:-.75px;border-radius:1px;background:currentColor}
.mm-x i:first-child{transform:rotate(45deg)}
.mm-x i:last-child{transform:rotate(-45deg)}

.mm-overlay{position:fixed;inset:0;z-index:60;background:transparent}
.mm-panel{position:fixed;inset:0;z-index:61;display:flex;flex-direction:column;background:var(--ink-950);clip-path:inset(0 0 0 0)}
.mm-panel:focus{outline:none}
.mm-top{height:var(--header-h);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex:none;position:relative}
.mm-panel[data-compact] .mm-top{transform:translateY(-4px)}
.mm-body{position:relative;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;padding-top:1.25rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))}
.mm-edge{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:3}
.mm-edge>.hairline{position:absolute;left:0;right:0;bottom:0;height:1px}

.mm-list{margin-top:1.25rem;border-top:1px solid transparent}
.mm-item{position:relative}
.mm-link{position:relative;display:flex;align-items:flex-start;gap:1rem;padding:.9rem 0 .8rem;color:var(--paper);text-decoration:none;border-radius:4px}
.mm-num{flex:none;width:2.5rem;display:inline-flex;align-items:center;gap:.4rem;padding-top:.55rem;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:.6875rem;line-height:1;letter-spacing:.18em;font-weight:500;color:var(--paper-mute);font-feature-settings:"tnum" 1,"zero" 1}
.mm-head{width:0;height:0;border-style:solid;border-width:3.5px 0 3.5px 5px;border-color:transparent transparent transparent var(--signal);opacity:0}
.mm-link[aria-current] .mm-num{color:var(--signal)}
.mm-link[aria-current] .mm-head{opacity:1}
.mm-mask{display:block;overflow:clip;padding:0 .06em .12em;margin:0 -.06em -.12em}
.mm-label{display:block;font-size:2.25rem;line-height:1.05;font-weight:600;letter-spacing:-.035em;transition:color 150ms linear}
.mm-rule{position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--line);transform-origin:0 50%}
.mm-actions{margin-top:auto;padding-top:2.5rem;display:grid;gap:.75rem}
.mm-actions .cta{width:100%}
.mm-foot{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.mm-here{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:.625rem;letter-spacing:.14em;font-weight:500;text-transform:uppercase;color:var(--paper-mute);white-space:nowrap;font-feature-settings:"tnum" 1,"zero" 1}
.mm-here>i{width:5px;height:5px;border-radius:999px;background:var(--signal);box-shadow:0 0 8px rgba(34,211,238,.7)}

@keyframes mm-curtain-in{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes mm-curtain-out{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}
@keyframes mm-edge-in{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes mm-edge-out{from{transform:translateY(0)}to{transform:translateY(-100%)}}
@keyframes mm-edge-fade{from{opacity:1}to{opacity:0}}
@keyframes mm-x-a{from{transform:translateY(-3.75px) rotate(0)}}
@keyframes mm-x-b{from{transform:translateY(3.75px) rotate(0) scaleX(.62)}}

html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]){animation:mm-curtain-in var(--f12) var(--ease-cut) both}
html[data-motion="full"] .mm-panel[data-state="closed"]{animation:mm-curtain-out var(--f9) var(--ease-exit) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-edge{animation:mm-edge-in var(--f12) var(--ease-cut) both,mm-edge-fade var(--f6) linear var(--f12) both}
html[data-motion="full"] .mm-panel[data-state="closed"] .mm-edge{opacity:1;animation:mm-edge-out var(--f9) var(--ease-exit) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-x i:first-child{animation:mm-x-a var(--f9) var(--ease-title) var(--f3) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-x i:last-child{animation:mm-x-b var(--f9) var(--ease-title) var(--f3) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-slate{animation:rdo-fade var(--f9) linear var(--f3) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-slate .hairline{animation:rdo-draw-x var(--f18) var(--ease-title) calc(var(--f3) + var(--f4)) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-label{animation:rdo-mask var(--f12) var(--ease-title) calc(var(--f6) + var(--mi) * var(--f3)) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-num{animation:rdo-fade var(--f9) linear calc(var(--f6) + var(--mi) * var(--f3) + var(--f2)) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-rule{animation:rdo-draw-x var(--f12) var(--ease-cut) calc(var(--f6) + var(--mi) * var(--f3)) both}
html[data-motion="full"] .mm-panel[data-state="open"]:not([data-settled]) .mm-late{animation:rdo-lift var(--f12) var(--ease-title) calc(var(--f6) + (4 + var(--mi)) * var(--f3)) both,rdo-fade 200ms linear calc(var(--f6) + (4 + var(--mi)) * var(--f3)) both}
`

const TOP_THRESHOLD = 24

export type MobileMenuProps = {
  /** the section currently under the playhead (from useActiveSection) */
  active: SectionId
  className?: string
}

/**
 * <md navigation: a 44×44 trigger that drops a full-screen curtain. Anchor clicks close the curtain
 * first, then scroll (the scroll lock is released by then) and replace the hash.
 */
export function MobileMenu({ active, className }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const target = useRef<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionSafe()

  // The menu only exists below md: close it if the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => mq.matches && setOpen(false)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [open])

  const onOpenChange = (next: boolean) => {
    // match the header row exactly (it sits 4px higher once the page has scrolled)
    if (next) setCompact(window.scrollY > TOP_THRESHOLD)
    setOpen(next)
  }

  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // modified clicks (new tab / window) keep native behaviour
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    target.current = id
    setOpen(false)
  }

  const onCloseAutoFocus = (e: Event) => {
    const id = target.current
    if (!id) return // Esc / close button / outside: Radix returns focus to the trigger
    target.current = null
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    try {
      history.replaceState(null, "", `#${id}`)
    } catch {
      /* sandboxed iframes */
    }
  }

  return (
    <>
      <style href="rdo-mobile-menu" precedence="medium">
        {MENU_CSS}
      </style>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Trigger asChild>
          <button type="button" className={cn("mm-burger", className)} aria-label="Open menu">
            <span className="mm-bars" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="mm-overlay" />
          <Dialog.Content
            className="mm-panel"
            aria-modal="true"
            aria-describedby={undefined}
            data-compact={compact ? "" : undefined}
            ref={panelRef}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              closeRef.current?.focus()
              // nothing to play (reduced motion): settle now so a later MOTION ON can't replay it
              const panel = panelRef.current
              if (panel && !panel.getAnimations({ subtree: true }).some((a) => a.playState === "running"))
                panel.setAttribute("data-settled", "")
            }}
            onCloseAutoFocus={onCloseAutoFocus}
            onAnimationEnd={(e) => {
              const panel = e.currentTarget
              if (panel.getAttribute("data-state") !== "open" || panel.hasAttribute("data-settled")) return
              const running = panel.getAnimations({ subtree: true }).some((a) => a.playState === "running")
              if (!running) panel.setAttribute("data-settled", "")
            }}
          >
            {/* the throughline riding the curtain's leading edge */}
            <span className="mm-edge" aria-hidden="true">
              <span className="hairline" />
            </span>

            <div className="mm-top shell">
              <a
                href="#home"
                onClick={go("home")}
                className="lm-host flex min-h-11 items-center gap-2.5 rounded-md text-[1.0625rem] font-semibold tracking-[-0.02em] text-paper"
              >
                <LogoMark />
                <span>
                  Re<span className="text-signal">Dev</span>Ops
                </span>
              </a>
              <Dialog.Close asChild>
                <button ref={closeRef} type="button" className="mm-burger" aria-label="Close menu">
                  <span className="mm-x" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
              </Dialog.Close>
            </div>

            <div className="mm-body shell">
              <div className="mm-slate slate">
                <Dialog.Title className="slate-label m-0 text-[length:inherit] font-[inherit]">Menu</Dialog.Title>
                <Hairline draw="none" className="slate-rule" />
              </div>

              <nav aria-label="Sections">
                <ol className="mm-list">
                  {NAV.map((l, i) => {
                    const current = l.id === active
                    return (
                      <li key={l.href} className="mm-item" style={{ "--mi": i } as CSSProperties}>
                        <a
                          href={l.href}
                          onClick={go(l.id)}
                          className="mm-link"
                          aria-current={current ? "location" : undefined}
                        >
                          <span className="mm-num" aria-hidden="true">
                            <span className="mm-head" />
                            {l.reel}
                          </span>
                          <span className="mm-mask">
                            <span className="mm-label">{l.label}</span>
                          </span>
                        </a>
                        <span className="mm-rule" aria-hidden="true" />
                      </li>
                    )
                  })}
                </ol>
              </nav>

              <div className="mm-actions">
                <div className="mm-late" style={{ "--mi": 0 } as CSSProperties}>
                  <CtaLink
                    href={CALENDLY_URL}
                    variant="primary"
                    size="lg"
                    external
                    icon="arrow"
                    onClick={() => setOpen(false)}
                  >
                    {PRIMARY_CTA_LABEL}
                  </CtaLink>
                </div>
                <div className="mm-late" style={{ "--mi": 1 } as CSSProperties}>
                  <CtaLink
                    href={CONTACT_MAILTO}
                    variant="secondary"
                    size="lg"
                    icon="mail"
                    onClick={() => setOpen(false)}
                  >
                    Email Recep
                  </CtaLink>
                </div>
                <div className="mm-late mm-foot" style={{ "--mi": 2 } as CSSProperties}>
                  <MotionToggle variant="inline" />
                  {/* "you are here": the reel under the playhead when the menu opened */}
                  <span className="mm-here" aria-hidden="true">
                    <i />
                    {reelLabel(active)}
                  </span>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
