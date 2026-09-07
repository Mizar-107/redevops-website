"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { CALENDLY_URL, CONTACT_EMAIL, CONTACT_MAILTO, PRIMARY_CTA_LABEL } from "@/lib/contact"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
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
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden" id="home">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_55%)]"
      />
      <div className="container relative mx-auto px-4 md:px-6 text-center">
        <motion.div className="max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/5 px-4 py-1.5 text-sm text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            DevOps consulting by Recep — hands-on, not slideware
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-50 via-gray-100 to-gray-400">
              Cut cloud waste.
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500">
              Ship with confidence.
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed text-pretty">
            ReDevOps partners with growing product teams to rightsize spend, harden infrastructure, and speed up
            delivery — without freezing your roadmap or replacing your engineers.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              asChild
              className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-xl shadow-cyan-500/25"
            >
              <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                {PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-gray-700 bg-gray-950/40 hover:bg-gray-900 hover:text-cyan-300">
              <Link href={CONTACT_MAILTO}>
                <Mail className="mr-2 h-5 w-5" />
                Email {CONTACT_EMAIL}
              </Link>
            </Button>
          </motion.div>
          <motion.p variants={itemVariants} className="mt-6 text-sm text-gray-500">
            Prefer to skim first?{" "}
            <Link
              href="#services"
              onClick={(e) => handleNavClick(e, "#services")}
              className="text-cyan-400/90 underline-offset-4 hover:underline"
            >
              See how we work →
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
