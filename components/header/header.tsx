"use client"

import { CtaLink } from "@/components/motion/cta-link"
import { NAV } from "@/lib/sections"
import { CALENDLY_URL, CONTACT_MAILTO, PRIMARY_CTA_LABEL_SHORT } from "@/lib/contact"
import { LogoMark } from "./logo-mark"

/** STUB (owned by W2). */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-ink-950/80 backdrop-blur-md">
      <div className="shell flex h-full items-center justify-between">
        <a href="#home" className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
          <LogoMark />
          <span>
            Re<span className="text-signal">Dev</span>Ops
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="flex items-baseline gap-2 text-sm text-paper-dim hover:text-paper">
              <span className="font-mono text-hud text-paper-mute">{l.reel}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <CtaLink href={CONTACT_MAILTO} variant="ghost" size="sm" icon="mail" className="hidden md:inline-flex">
            Email
          </CtaLink>
          <CtaLink href={CALENDLY_URL} variant="primary" size="sm" external magnetic>
            {PRIMARY_CTA_LABEL_SHORT}
          </CtaLink>
        </div>
      </div>
    </header>
  )
}
