"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShieldCheck, Zap, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

const services = [
  {
    icon: DollarSign,
    title: "Cloud Cost Optimization",
    description: "Reduce cloud spending by 30-50% through deep audits, rightsizing, and reserved instance planning.",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructure Reliability",
    description: "SRE-focused monitoring and incident response to minimize downtime and boost system resilience.",
  },
  {
    icon: Zap,
    title: "CI/CD Pipeline Optimization",
    description:
      "Streamline deployments and reduce release cycles from weeks to hours with automated, efficient pipelines.",
  },
  {
    icon: Users,
    title: "DevOps Team Augmentation",
    description: "Work alongside your developers or act as your interim DevOps team to bridge expertise gaps.",
  },
]

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
}

function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateX: 5, rotateY: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative"
    >
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm h-full group transition-all duration-300 overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-cyan-400/10 transition-colors">
              <Icon className="h-6 w-6 text-cyan-400" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-100">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">{description}</p>
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
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Your Partner in DevOps Excellence</h2>
          <p className="mt-4 text-lg text-gray-400">
            From cost savings to bulletproof reliability, we provide the expertise you need to scale effectively.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  )
}
