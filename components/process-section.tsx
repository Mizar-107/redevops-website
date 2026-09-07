"use client"

import { CheckCircle2, Search, Map, Handshake } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import type { LucideIcon } from "lucide-react"

const processSteps: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: Search,
    title: "1. Discover & diagnose",
    description:
      "A free 30-minute call to align on goals, then a focused review of spend, reliability signals, and delivery bottlenecks — so we fix the right problems first.",
  },
  {
    icon: Map,
    title: "2. Plan & implement",
    description:
      "A clear, prioritized action plan with owners and sequencing. We implement alongside your team with minimal disruption to day-to-day product work.",
  },
  {
    icon: Handshake,
    title: "3. Stabilize & hand over",
    description:
      "Tune what we shipped, document how it works, and pair with your engineers so the gains stick long after the engagement ends.",
  },
]

function ProcessStep({
  step,
  index,
}: {
  step: (typeof processSteps)[0]
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-160px" })
  const isEven = index % 2 === 0
  const Icon = step.icon

  const cardVariants = {
    hidden: { opacity: 0, x: isEven ? -80 : 80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const circleVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { duration: 0.35, ease: [0.42, 0, 0.58, 1], delay: 0.2 },
    },
  }

  return (
    <div ref={ref} className="relative mb-12 md:mb-16 last:mb-0">
      <div className={`md:flex items-center ${isEven ? "flex-row-reverse" : "flex-row"}`}>
        <div className="md:w-5/12">
          <motion.div variants={cardVariants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
            <div className="bg-gray-900/55 border border-gray-800 rounded-xl p-6 backdrop-blur-sm shadow-lg hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/25 md:hidden">
                  <Icon className="h-4 w-4 text-cyan-400" />
                </span>
                <h3 className="text-xl font-bold text-gray-100">{step.title}</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        </div>
        <div className="hidden md:flex md:w-2/12 justify-center">
          <motion.div
            variants={circleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative z-10 w-11 h-11 bg-gray-950 border-2 border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.25)]"
          >
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </motion.div>
        </div>
        <div className="md:w-5/12" />
      </div>
    </div>
  )
}

export function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-240px" })

  return (
    <section id="process" className="py-16 md:py-24 bg-gray-950/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">Process</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
            A clear path from first call to handover
          </h2>
          <p className="mt-4 text-lg text-gray-400 text-pretty">
            Transparent steps, visible priorities, and work that fits how product teams already ship.
          </p>
        </div>
        <div ref={ref} className="mt-16 max-w-4xl mx-auto relative">
          <motion.div
            className="absolute left-1/2 top-5 bottom-5 w-0.5 bg-gradient-to-b from-cyan-500/40 via-gray-700 to-purple-500/30 rounded-full origin-top hidden md:block"
            style={{ transform: "translateX(-50%)" }}
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <div>
            {processSteps.map((step, index) => (
              <ProcessStep key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
