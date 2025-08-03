"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
}

export function HeroSection() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault()
    const targetId = href.replace(/.*#/, "")
    const elem = document.getElementById(targetId)
    elem?.scrollIntoView({
      behavior: "smooth",
    })
  }

  return (
    <section className="relative py-24 md:py-32 lg:py-40" id="home">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <motion.div className="max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-50 via-gray-200 to-gray-400"
          >
            Reduce Cloud Costs by 30-60%.
            <br />
            <span className="bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Build Unbreakable Infrastructure.
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-400">
            We help growing companies slash cloud spending and achieve rock-solid reliability. See results in 30 days,
            without disrupting your workflow.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="https://calendly.com/eksiertu/30min" target="_blank">
                Schedule Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#services" onClick={(e) => handleNavClick(e, "#services")}>
                Learn More
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
