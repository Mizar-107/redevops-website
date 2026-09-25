import { DollarSign, ShieldCheck, Users, Zap, type LucideIcon } from "lucide-react"
import type { SceneId } from "@/lib/reel/scene"

/** Source of truth for Services copy + mono tag lines built only from the copy. */
export const SERVICES: readonly {
  id: SceneId
  icon: LucideIcon
  title: string
  description: string
  tags: readonly string[]
}[] = [
  {
    id: "cost",
    icon: DollarSign,
    title: "Cloud cost optimization",
    description:
      "Spend audits, rightsizing, storage tiering, and commitment planning, so you stop paying for idle capacity and reservations that don't match your usage.",
    tags: ["spend audit", "rightsizing", "storage tiering", "commitment planning"],
  },
  {
    id: "reliability",
    icon: ShieldCheck,
    title: "Infrastructure reliability",
    description:
      "SRE-grade monitoring, alerting, runbooks, and incident practice. Fewer surprise outages, and recoveries your team can repeat.",
    tags: ["monitoring", "alerting", "runbooks", "incident practice"],
  },
  {
    id: "delivery",
    icon: Zap,
    title: "CI/CD & delivery speed",
    description:
      "Faster, safer pipelines: fewer flaky stages, cleaner environments, and deploys your team trusts on a steady cadence.",
    tags: ["flaky stages", "clear environments", "trusted cadence"],
  },
  {
    id: "partnership",
    icon: Users,
    title: "Embedded DevOps partnership",
    description:
      "Extra hands for your engineers, or cover for an interim DevOps gap. We pair on real systems, document the decisions, and leave your team stronger.",
    tags: ["pair on real systems", "document decisions", "leave the team stronger"],
  },
]
