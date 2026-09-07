"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShieldCheck, Zap, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

const services = [
  {
    icon: DollarSign,
    title: "Cloud cost optimization",
    description:
      "Deep spend audits, rightsizing, storage tiering, and commitment planning — so you stop paying for idle capacity and mistimed reservations.",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructure reliability",
    description:
      "SRE-minded monitoring, alerting, runbooks, and incident practice that reduce surprise outages and make recovery repeatable.",
  },
  {
    icon: Zap,
    title: "CI/CD & delivery speed",
    description:
      "Faster, safer pipelines: fewer flaky stages, clearer environments, and deployments your team can trust on a regular cadence.",
  },
  {
    icon: Users,
    title: "Embedded DevOps partnership",
    description:
      "Augment your engineers or fill an interim DevOps gap — pair on real systems, document decisions, and leave the team stronger.",
  },
]

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  index: number
}

function ServiceCard({ icon: Icon, title, description, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="relative h-full"
    >
      <Card className="bg-gray-900/55 border-gray-800 backdrop-blur-sm h-full group transition-all duration-300 overflow-hidden hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5">
        <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
        <div className="relative">
          <CardHeader className="flex flex-row items-start gap-4 pb-3">
            <div className="p-3 bg-gray-800/80 rounded-xl ring-1 ring-gray-700 group-hover:ring-cyan-400/40 group-hover:bg-cyan-400/10 transition-colors">
              <Icon className="h-6 w-6 text-cyan-400" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-100 pt-1.5 leading-snug">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 leading-relaxed">{description}</p>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-gray-950/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">Services</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
            Practical DevOps help that sticks
          </h2>
          <p className="mt-4 text-lg text-gray-400 text-pretty">
            Focused engagements for teams that need clearer spend, steadier systems, and smoother shipping — not another
            generic transformation deck.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <ServiceCard key={service.title} {...service} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
