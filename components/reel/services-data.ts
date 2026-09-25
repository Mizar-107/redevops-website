import { DollarSign, ShieldCheck, Users, Zap, type LucideIcon } from "lucide-react"
import type { SceneId } from "@/lib/reel/scene"

/** Source of truth for Services copy (verbatim) + mono tag lines built only from the copy. */
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
      "Deep spend audits, rightsizing, storage tiering, and commitment planning — so you stop paying for idle capacity and mistimed reservations.",
    tags: ["spend audit", "rightsizing", "storage tiering", "commitment planning"],
  },
  {
    id: "reliability",
    icon: ShieldCheck,
    title: "Infrastructure reliability",
    description:
      "SRE-minded monitoring, alerting, runbooks, and incident practice that reduce surprise outages and make recovery repeatable.",
    tags: ["monitoring", "alerting", "runbooks", "incident practice"],
  },
  {
    id: "delivery",
    icon: Zap,
    title: "CI/CD & delivery speed",
    description:
      "Faster, safer pipelines: fewer flaky stages, clearer environments, and deployments your team can trust on a regular cadence.",
    tags: ["flaky stages", "clear environments", "trusted cadence"],
  },
  {
    id: "partnership",
    icon: Users,
    title: "Embedded DevOps partnership",
    description:
      "Augment your engineers or fill an interim DevOps gap — pair on real systems, document decisions, and leave the team stronger.",
    tags: ["pair on real systems", "document decisions", "leave the team stronger"],
  },
]
