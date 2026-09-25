"use client"

import { useEffect, useRef } from "react"
import { frame, useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"
import { clamp } from "@/lib/motion/math"
import { useScrub } from "@/hooks/use-scrub"
import s from "@/components/final/final.module.css"

/** Only real facts: what we do and what we work with, one item per line. */
const CREDITS = [
  {
    role: "What we do",
    names: ["Cloud cost optimization", "Infrastructure reliability", "CI/CD & delivery", "Embedded DevOps partnership"],
  },
  { role: "Clouds", names: ["AWS", "Google Cloud", "Azure"] },
  { role: "Also working with", names: ["Kubernetes", "containers", "CI platforms", "observability", "runbooks"] },
] as const

/** minimum extra speed of the column over the page: 0.35 → the credits roll at ≥ 1.35× scroll */
const OVERSPEED = 0.35
/** where the last credit rests in the window at the end of the passage (fraction of window height) */
const END_AT = 0.8
/** the passage ends when the window's bottom edge reaches this fraction of the viewport */
const END_VIEW = 0.55

/**
 * The at-a-glance roll: two columns (roles right, names left, around a centre gutter;
 * stacked and centred on phones) rolling through a masked window (60svh; 70svh on phones), then the
 * honesty card (static, after the roll). Scroll-driven only, no autoplay. p = the window's own passage
 * (["start end", "end 55%"]); the column's translateY = end + travel · (1 − p): it enters with the first
 * credit at the band's lower edge, rolls at ≥ 1.35× the page (≈1.5× on typical viewports) and settles
 * with its last row at 80% of the window while the window is still well on screen. The range is
 * measured (window + column heights) instead of fixed percentages so that every row crosses the unmasked band while it can actually be read, on any viewport.
 * Written imperatively (framer frame loop → style); zero React renders while scrolling.
 * still (no JS / reduced / MOTION off): natural position, no mask.
 */
export function CreditsCrawl({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const colRef = useRef<HTMLDivElement>(null)
  const geo = useRef({ end: 0, travel: 0, ready: false })
  const last = useRef(-1)
  // the window's own passage: from entering at the bottom to its bottom edge at 55% of the viewport
  const { progress } = useScrub(rootRef, ["start end", `end ${END_VIEW * 100}%`])

  const render = (p: number, force = false) => {
    const col = colRef.current
    const g = geo.current
    if (!col || !g.ready) return
    if (!force && Math.abs(p - last.current) < 0.0002) return
    last.current = p
    const y = g.end + g.travel * (1 - clamp(p))
    col.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
  }

  useMotionValueEvent(progress, "change", (v) => {
    frame.update(() => render(v))
  })

  useEffect(() => {
    const root = rootRef.current
    const col = colRef.current
    if (!root || !col) return
    const measure = () => {
      const wh = root.clientHeight
      const hc = col.offsetHeight
      const first = col.querySelector<HTMLElement>("dl > div")?.offsetHeight ?? 40
      // a short column rests centred in the unmasked band; a tall one with its last row at END_AT
      const end = hc <= 0.64 * wh ? (wh - hc) / 2 : END_AT * wh - hc
      // it starts with the first credit just inside the band's lower edge, so the director credit
      // is read while the window is on screen …
      const start = 0.82 * wh - first
      geo.current = {
        end,
        // … and rolls at least 1.35× the page over the passage (scroll distance × overspeed)
        travel: Math.max(start - end, OVERSPEED * ((1 - END_VIEW) * window.innerHeight + wh)),
        ready: true,
      }
      render(progress.get(), true)
    }
    measure()
    const ro = new ResizeObserver(() => frame.read(measure))
    ro.observe(root)
    ro.observe(col)
    window.addEventListener("resize", measure, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className}>
      <div ref={rootRef} className={s.crawl}>
        <div ref={colRef} className={cn("shell", s.crawlCol)}>
          <dl className="mx-auto grid max-w-3xl gap-y-8 sm:gap-y-12">
            {CREDITS.map((c, i) => (
              <div key={c.role} className={s.credit}>
                <dt className="font-mono text-slate uppercase text-paper-mute">{c.role}</dt>
                <dd>
                  <ul
                    className={cn(
                      s.names,
                      i === 0
                        ? "text-[1.625rem] font-semibold tracking-[-0.02em] sm:text-[2rem]"
                        : "text-[1.0625rem] font-medium tracking-[-0.01em] sm:text-xl",
                    )}
                  >
                    {c.names.map((n) => (
                      <li key={n} className="leading-snug text-paper">
                        {n}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="shell">
        <p className="mx-auto mt-10 max-w-md rounded-[10px] border border-line-strong bg-ink-900/60 px-6 py-5 text-center font-mono text-[0.8125rem] leading-relaxed text-paper-dim">
          Everything here describes real work: no client logos, no made-up testimonials, no invented numbers.
        </p>
      </div>
    </div>
  )
}
