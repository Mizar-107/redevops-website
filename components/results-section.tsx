"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef, type MouseEvent } from "react"
import CountUp from "react-countup"

const stats = [
  { value: 60, suffix: "%", label: "Max Cloud Cost Reduction" },
  { value: 99.99, suffix: "%", decimals: 2, label: "Uptime Achieved" },
  { value: 30, suffix: " Days", label: "To See Tangible Results" },
  { value: 80, suffix: "%", label: "Faster Deployment Cycles" },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative h-full"
    >
      {children}
    </motion.div>
  )
}

export function ResultsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="results" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Proven Results, Real Impact</h2>
          <p className="mt-4 text-lg text-gray-400">
            We don't just promise—we deliver. Our strategies translate into measurable improvements for your business.
          </p>
        </div>
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="h-full">
              <AnimatedCard>
                <Card className="bg-gray-900/50 border-gray-800 text-center h-full backdrop-blur-sm relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ transform: "translateZ(-10px)" }}
                  />
                  <CardContent
                    className="p-6 flex flex-col justify-center items-center h-full"
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                      {isInView && <CountUp end={stat.value} duration={2.5} decimals={stat.decimals || 0} />}
                      {stat.suffix}
                    </p>
                    <p className="mt-2 text-gray-400">{stat.label}</p>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16"
        >
          <AnimatedCard>
            <Card className="bg-gray-900/50 border-gray-800 max-w-3xl mx-auto relative overflow-hidden backdrop-blur-sm">
              <CardContent className="p-8 relative z-10" style={{ transform: "translateZ(20px)" }}>
                <blockquote className="text-center text-xl italic text-gray-300">
                  "ReDevOps transformed our infrastructure. We're saving over 40% on our AWS bill and our systems have
                  never been more stable. Their team integrated seamlessly with ours."
                </blockquote>
                <p className="text-center mt-4 font-semibold text-cyan-400">— CTO, Fast-Growth SaaS Startup</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>
      </div>
    </section>
  )
}
