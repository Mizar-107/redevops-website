"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Gauge, Layers, Rocket, Workflow } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const outcomes: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: Gauge,
    title: "Leaner cloud bills",
    description:
      "Find idle and oversized resources, tidy storage tiers, and align commitments with real usage patterns.",
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
    description:
      "Pipelines and environments your developers trust, so shipping stops feeling like a weekend event.",
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
    label: "Example focus",
    title: "Spend & capacity review",
    body: "Map the top cost drivers, flag obvious waste, and hand you a prioritized fix list your team can execute or we can implement together.",
  },
  {
    label: "Example focus",
    title: "Delivery & observability tune-up",
    body: "Tighten CI stages, stabilize environments, and replace noisy alerts with signals that match how you actually operate.",
  },
]

export function ResultsSection() {
  return (
    <section id="results" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">Outcomes</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
            What better looks like in practice
          </h2>
          <p className="mt-4 text-lg text-gray-400 text-pretty">
            We measure success by operational clarity and sustainable improvements — not vanity dashboards or inflated
            percentages.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
            >
              <Card className="bg-gray-900/55 border-gray-800 h-full backdrop-blur-sm hover:border-cyan-500/35 transition-colors">
                <CardHeader className="pb-2">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/25">
                    <item.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-100">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {exampleFocus.map((ex, index) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            >
              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border-gray-800 h-full relative overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                />
                <CardContent className="p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/90">{ex.label}</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-100">{ex.title}</h3>
                  <p className="mt-3 text-gray-400 leading-relaxed">{ex.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          Results depend on your starting point, architecture, and how quickly recommendations are adopted. We set
          expectations in the first conversation — no fabricated case-study numbers.
        </p>
      </div>
    </section>
  )
}
