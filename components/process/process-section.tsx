"use client"

import { Handshake, Map, Search } from "lucide-react"
import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"

const steps = [
  {
    icon: Search,
    title: "Discover & diagnose",
    description:
      "A free 30-minute call to align on goals, then a focused review of spend, reliability signals, and delivery bottlenecks — so we fix the right problems first.",
  },
  {
    icon: Map,
    title: "Plan & implement",
    description:
      "A clear, prioritized action plan with owners and sequencing. We implement alongside your team with minimal disruption to day-to-day product work.",
  },
  {
    icon: Handshake,
    title: "Stabilize & hand over",
    description:
      "Tune what we shipped, document how it works, and pair with your engineers so the gains stick long after the engagement ends.",
  },
]

/** STUB (owned by W7). */
export function ProcessSection() {
  return (
    <section id="process" aria-labelledby="process-title" className="relative py-24 md:py-32">
      <div className="shell">
        <Slate section="process" />
        <h2 id="process-title" className="mt-6 max-w-4xl text-h2 text-balance">
          <SplitText text="A clear path from first call to handover" />
        </h2>
        <Reveal as="p" className="mt-6 max-w-[60ch] text-lede text-paper-dim">
          Transparent steps, visible priorities, and work that fits how product teams already ship.
        </Reveal>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} index={i} as="li" className="rounded-xl border border-line bg-ink-900 p-6">
              <p className="font-mono text-slate uppercase text-paper-mute">Clip 0{i + 1}</p>
              <h3 className="mt-3 text-h3-sm">{s.title}</h3>
              <p className="mt-3 text-paper-dim">{s.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
