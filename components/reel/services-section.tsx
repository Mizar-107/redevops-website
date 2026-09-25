"use client"

import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { Hairline } from "@/components/motion/hairline"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { SERVICES } from "./services-data"

/** STUB (owned by W4). */
export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative py-24 md:py-32">
      <Hairline draw="center" className="absolute inset-x-0 top-0" />
      <div className="shell">
        <Slate section="services" />
        <h2 id="services-title" className="mt-6 max-w-4xl text-h2 text-balance">
          <SplitText text="Practical DevOps help that sticks" />
        </h2>
        <Reveal as="p" className="mt-6 max-w-[60ch] text-lede text-paper-dim">
          Focused engagements for teams that need clearer spend, steadier systems, and smoother shipping — not another
          generic transformation deck.
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} index={i} as="article" className="vf-host relative rounded-xl border border-line bg-ink-900 p-8">
              <ViewfinderFrame />
              <p className="font-mono text-slate uppercase text-paper-mute">0{i + 1} · {s.id}</p>
              <h3 className="mt-3 text-h3-sm">{s.title}</h3>
              <p className="mt-3 text-body text-paper-dim">{s.description}</p>
              <p className="mt-4 font-mono text-hud uppercase text-paper-mute">{s.tags.join(" → ")}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
