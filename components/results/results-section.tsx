"use client"

import { Gauge, Layers, Rocket, Workflow } from "lucide-react"
import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { Hairline } from "@/components/motion/hairline"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"

const outcomes = [
  {
    icon: Gauge,
    title: "Leaner cloud bills",
    description: "Find idle and oversized resources, tidy storage tiers, and align commitments with real usage patterns.",
  },
  {
    icon: Layers,
    title: "Clearer reliability posture",
    description:
      "Meaningful alerts, actionable runbooks, and a shared language for incidents — fewer pages that go nowhere.",
  },
  {
    icon: Rocket,
    title: "Faster, safer releases",
    description: "Pipelines and environments your developers trust, so shipping stops feeling like a weekend event.",
  },
  {
    icon: Workflow,
    title: "Knowledge left behind",
    description:
      "Docs, diagrams, and pairing so improvements survive after the engagement — not a black box of magic scripts.",
  },
]

const exampleFocus = [
  {
    title: "Spend & capacity review",
    body: "Map the top cost drivers, flag obvious waste, and hand you a prioritized fix list your team can execute or we can implement together.",
  },
  {
    title: "Delivery & observability tune-up",
    body: "Tighten CI stages, stabilize environments, and replace noisy alerts with signals that match how you actually operate.",
  },
]

/** STUB (owned by W6). */
export function ResultsSection() {
  return (
    <section id="results" aria-labelledby="results-title" className="relative py-24 md:py-32">
      <div className="shell">
        <Slate section="results" />
        <div className="my-14 py-14 text-center">
          <Hairline />
          <p className="mx-auto my-10 max-w-[40ch] text-[clamp(1.25rem,2.2vw,1.75rem)] font-medium">
            We measure success by operational clarity and sustainable improvements — not vanity dashboards or inflated
            percentages.
          </p>
          <Hairline />
        </div>
        <h2 id="results-title" className="text-h2 text-balance">
          <SplitText text="What better looks like in practice" />
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((o, i) => (
            <Reveal key={o.title} index={i} as="article" className="vf-host relative rounded-xl border border-line bg-ink-900 p-6">
              <ViewfinderFrame />
              <o.icon className="h-5 w-5 text-signal" aria-hidden="true" />
              <h3 className="mt-4 text-h3-sm">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">{o.description}</p>
            </Reveal>
          ))}
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {exampleFocus.map((ex, i) => (
            <Reveal key={ex.title} index={i} as="article" className="rounded-xl border border-line bg-ink-900 p-8">
              <p className="font-mono text-slate uppercase text-paper-mute">Example focus</p>
              <h3 className="mt-2 text-h3-sm">{ex.title}</h3>
              <p className="mt-3 text-paper-dim">{ex.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center font-mono text-xs text-paper-dim">
          Results depend on your starting point, architecture, and how quickly recommendations are adopted. We set
          expectations in the first conversation — no fabricated case-study numbers.
        </p>
      </div>
    </section>
  )
}
