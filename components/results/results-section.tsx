import type { CSSProperties } from "react"
import { Gauge, Layers, Rocket, Workflow, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { fms, staggerFor } from "@/lib/motion/tokens"
import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Hairline } from "@/components/motion/hairline"
import { ScrambleText } from "@/components/motion/scramble-text"
import { NoticeCard } from "./notice-card"
import { TelemetryScope } from "./telemetry-scope"
import { LowerThird } from "./lower-third"
import { SlatedCard } from "./slated-card"
import s from "./results.module.css"

const outcomes: { icon: LucideIcon; title: string; description: string }[] = [
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
    scene: "A",
    title: "Spend & capacity review",
    body: "Map the top cost drivers, flag obvious waste, and hand you a prioritized fix list your team can execute or we can implement together.",
  },
  {
    scene: "B",
    title: "Delivery & observability tune-up",
    body: "Tighten CI stages, stabilize environments, and replace noisy alerts with signals that match how you actually operate.",
  },
]

const H2 = "What better looks like in practice"
/** "better" racks focus 250ms after the whole line has landed (last word's delay + f18). */
const H2_WORDS = H2.split(/\s+/).length
const RACK_MS = Math.round((H2_WORDS - 1) * staggerFor(H2_WORDS, 83, 500) + fms(18) + 250)

/**
 * REEL 03 · OUTCOMES. Density 1 (the still notice card), then 5 (the scope, lower-thirds, slates).
 * Server component; the Telemetry Scope and the scrambles are the only client islands.
 */
export function ResultsSection() {
  return (
    <section id="results" aria-labelledby="results-title" className="relative py-24 md:py-32">
      <div className="shell">
        <Slate section="results" />

        {/* 1 · the honesty beat: the throughline arrives as the notice's top rule, then holds still */}
        <NoticeCard className="mt-10 md:mt-14" />

        {/* 2 · the feature */}
        <h2
          id="results-title"
          className="mt-20 max-w-[16ch] text-h2 text-balance text-paper md:mt-28"
          style={{ "--rack": `${RACK_MS}ms` } as CSSProperties}
        >
          <SplitText text={H2} className={s.rack} />
        </h2>

        <TelemetryScope className="mt-10 md:mt-14" />

        {/* 3 · outcomes as lower-thirds */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-24">
          {outcomes.map((o, i) => (
            <LowerThird key={o.title} index={i} icon={o.icon} title={o.title} description={o.description} />
          ))}
        </div>

        {/* 4 · example focus as slated scenes (stacked: a wider gap is the room the next clapper opens into) */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-10 md:mt-28 md:grid-cols-2 md:gap-6">
          {exampleFocus.map((ex) => (
            <SlatedCard key={ex.title} scene={ex.scene} title={ex.title} body={ex.body} />
          ))}
        </div>

        {/* 5 · footnote bookend */}
        <div className="mx-auto mt-20 max-w-2xl md:mt-24">
          <div aria-hidden="true">
            <Hairline draw="center" />
            <Hairline draw="center" glow={false} delay={125} className={cn(s.noticeRuleSoft, "mt-[6px]")} />
          </div>
          <p
            data-reveal="custom"
            className={cn(s.foot, "mt-6 text-center font-mono text-[0.75rem] leading-[1.7] text-paper-dim")}
          >
            Results depend on your starting point, architecture, and how quickly recommendations are adopted. We set
            expectations in the first conversation —{" "}
            <ScrambleText text="no fabricated case-study numbers." className={s.footClause} />
            <span aria-hidden="true" className={s.caret}>
              ▍
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
