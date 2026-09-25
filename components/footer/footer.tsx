import { LogoMark } from "@/components/header/logo-mark"
import { MotionToggle } from "@/components/motion/motion-toggle"
import { CtaLink } from "@/components/motion/cta-link"
import { Slate } from "@/components/motion/slate"
import { NAV } from "@/lib/sections"
import { CALENDLY_URL, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"
import { cn } from "@/lib/utils"
import s from "@/components/final/final.module.css"
import { CreditsCrawl } from "./credits-crawl"

/**
 * Footer: the at-a-glance roll, a last booking prompt and the utility footer. A server component:
 * the roll, the toggle and the CTAs are small client islands; everything else (and the copyright
 * year) is rendered on the server.
 */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="credits" aria-labelledby="credits-title" className="relative bg-ink-950 pt-16 md:pt-20">
      <h2 id="credits-title" className="sr-only">
        At a glance
      </h2>

      <CreditsCrawl />

      {/* last booking prompt: static, after the roll */}
      <div className="shell flex flex-col items-center gap-4 pb-20 pt-16 text-center md:pb-24">
        <Slate section="credits" label="STILL READING?" cut={null} align="center" className={cn("w-full max-w-md", s.slateFit)} />
        <CtaLink href={CALENDLY_URL} variant="ghost" size="lg" external icon="arrow" className="max-w-full">
          {PRIMARY_CTA_LABEL}
        </CtaLink>
      </div>

      {/* utility footer: always static. lg bottom padding keeps the last row clear of the fixed
          chrome (MOTION pill / scrub OSD sit 20–48px above the viewport bottom at lg+) */}
      <div className="border-t border-line">
        <div className="shell pb-8 pt-12 lg:pb-[4.5rem]">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.4fr)_auto_auto] lg:gap-16">
            <div className="max-w-sm">
              <a href="#home" className="lm-host inline-flex min-h-[44px] items-center gap-2.5 font-semibold tracking-[-0.02em] text-paper">
                <LogoMark />
                <span>
                  Re<span className="text-signal">Dev</span>Ops
                </span>
              </a>
              <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                Hands-on DevOps consulting for growing product teams: cloud cost, reliability, and delivery.
              </p>
            </div>

            <nav aria-label="Footer">
              {/* 2 × 2 in the narrow md column (a wrapping row would leave "05 FAQ" alone), one row on
                  single-column sm, a list at lg */}
              <ul className="grid grid-cols-2 gap-x-8 sm:flex sm:flex-wrap sm:gap-x-7 md:grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-1 lg:gap-0">
                {NAV.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className={cn("text-sm", s.navLink)}>
                      <span aria-hidden="true" className="font-mono text-hud text-paper-mute">
                        {l.num}
                      </span>
                      <span className={s.navText}>{l.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col items-start gap-1">
              <span className="font-mono text-slate uppercase text-paper-mute">Email</span>
              <a href={CONTACT_MAILTO} className={cn("text-sm", s.navLink)}>
                <span className={s.navText}>{CONTACT_EMAIL}</span>
              </a>
              <MotionToggle variant="inline" className="-ml-px" />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-paper-dim md:flex-row md:items-center md:gap-3">
            <p>&copy; {year} ReDevOps. All rights reserved.</p>
            <span aria-hidden="true" className="hidden text-paper-mute md:inline">
              ·
            </span>
            <p>Built for clarity.</p>
            <a href="#home" className={cn("mt-3 md:ml-auto md:mt-0", s.navLink)}>
              <span className={s.navText}>Back to top ↑</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
