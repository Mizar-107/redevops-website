"use client"

import { useLayoutEffect, useRef } from "react"
import { motion, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { useScrub } from "@/hooks/use-scrub"
import s from "@/components/final/final.module.css"

/** Only real facts. Multi-name credits roll one name per line, like a real crawl. */
const CREDITS = [
  { role: "Directed & engineered by", names: ["Recep"] },
  {
    role: "Practice",
    names: ["Cloud cost optimization", "Infrastructure reliability", "CI/CD & delivery", "Embedded DevOps partnership"],
  },
  { role: "Clouds", names: ["AWS", "Google Cloud", "Azure"] },
  { role: "Also featuring", names: ["Kubernetes", "containers", "CI platforms", "observability", "runbooks"] },
] as const

/**
 * The end-credits crawl: classic two-column credits (roles right, names left, around a centre
 * gutter; stacked and centred on phones), then the honesty card. Scroll-driven only (no autoplay):
 * the column's translateY = lerp(20%, -35%, footer progress) inside a 60svh masked window, so it rolls
 * a little faster than the page. still (no JS / reduced / MOTION off): natural position, no mask.
 */
export function CreditsCrawl({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement | null>(null)
  // useScroll reads its target in a layout effect; this one is declared first, so it runs first
  useLayoutEffect(() => {
    footerRef.current = rootRef.current?.closest("footer") ?? rootRef.current
  }, [])
  const { progress } = useScrub(footerRef, ["start end", "end end"])
  const y = useTransform(progress, [0, 1], ["20%", "-35%"])

  return (
    <div ref={rootRef} className={cn(s.crawl, className)}>
      <motion.div className={cn("shell", s.crawlCol)} style={{ y }}>
        <dl className="mx-auto grid max-w-3xl gap-y-11 sm:gap-y-12">
          {CREDITS.map((c, i) => (
            <div key={c.role} className={s.credit}>
              <dt className="font-mono text-slate uppercase text-paper-mute">{c.role}</dt>
              <dd>
                <ul className={cn(s.names, i === 0 ? "text-[1.75rem] font-semibold tracking-[-0.02em] sm:text-[2rem]" : "text-lg font-medium tracking-[-0.01em] sm:text-xl")}>
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
        <p className="mx-auto mt-16 max-w-md rounded-[10px] border border-line-strong bg-ink-900/60 px-6 py-5 text-center font-mono text-[0.8125rem] leading-relaxed text-paper-dim">
          No fake logos were used in the making of this site. No metrics were invented.
        </p>
      </motion.div>
    </div>
  )
}
