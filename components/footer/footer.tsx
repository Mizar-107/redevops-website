import { LogoMark } from "@/components/header/logo-mark"
import { MotionToggle } from "@/components/motion/motion-toggle"
import { NAV } from "@/lib/sections"
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact"

/** STUB (owned by W9). */
export function Footer() {
  return (
    <footer id="credits" className="border-t border-line bg-ink-950">
      <div className="shell py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2.5 font-semibold">
              <LogoMark />
              <span>
                Re<span className="text-signal">Dev</span>Ops
              </span>
            </div>
            <p className="text-sm text-paper-dim">
              Hands-on DevOps consulting by Recep — cloud cost, reliability, and delivery for growing product teams.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-paper-dim hover:text-signal">
                {l.label}
              </a>
            ))}
          </nav>
          <a href={CONTACT_MAILTO} className="text-sm text-paper-dim hover:text-signal">
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-paper-mute">&copy; {new Date().getFullYear()} ReDevOps. All rights reserved.</p>
          <p className="text-xs text-paper-mute">Built for clarity — no fake logos, no invented metrics.</p>
          <MotionToggle variant="inline" />
        </div>
      </div>
    </footer>
  )
}
