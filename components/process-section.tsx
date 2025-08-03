"use client"

import { CheckCircle } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const processSteps = [
  {
    title: "1. Discovery & Audit",
    description:
      "We start with a free 30-minute consultation to understand your goals, followed by a comprehensive audit of your current cloud infrastructure and DevOps practices.",
  },
  {
    title: "2. Strategy & Implementation",
    description:
      "We present a clear action plan with prioritized recommendations. Upon approval, our team begins implementation with zero disruption to your existing workflows.",
  },
  {
    title: "3. Optimization & Handover",
    description:
      "We monitor the results, fine-tune for peak performance, and provide your team with the documentation and training needed to maintain success long-term.",
  },
]

function ProcessStep({ step, index }: { step: (typeof processSteps)[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-200px" })
  const isEven = index % 2 === 0

  const cardVariants = {
    hidden: { opacity: 0, x: isEven ? -100 : 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const circleVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1], delay: 0.3 },
    },
  }

  return (
    <div ref={ref} className="relative mb-12 md:mb-16">
      <div className={`md:flex items-center ${isEven ? "flex-row-reverse" : "flex-row"}`}>
        <div className="md:w-5/12">
          <motion.div variants={cardVariants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm shadow-lg">
              <h3 className="text-xl font-bold text-gray-100">{step.title}</h3>
              <p className="mt-3 text-gray-400">{step.description}</p>
            </div>
          </motion.div>
        </div>
        <div className="hidden md:flex md:w-2/12 justify-center">
          <motion.div
            variants={circleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative z-10 w-10 h-10 bg-gray-950 border-2 border-cyan-400 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-6 h-6 text-cyan-400" />
          </motion.div>
        </div>
        <div className="md:w-5/12"></div>
      </div>
    </div>
  )
}

export function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-300px" })

  return (
    <section id="process" className="py-16 md:py-24 bg-gray-950/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our 3-Step Path to Success</h2>
          <p className="mt-4 text-lg text-gray-400">
            A simple, transparent, and developer-friendly process designed for rapid results.
          </p>
        </div>
        <div ref={ref} className="mt-16 max-w-4xl mx-auto relative">
          <motion.div
            className="absolute left-1/2 top-5 bottom-5 w-1 bg-gray-800 rounded-full origin-top hidden md:block"
            style={{ transform: "translateX(-50%)" }}
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1, ease: "circIn" }}
          />
          <div>
            {processSteps.map((step, index) => (
              <ProcessStep key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
