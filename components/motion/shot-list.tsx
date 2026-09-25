import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type ShotListProps = {
  items: readonly string[]
  size?: "md" | "lg"
  className?: string
}

/**
 * A checklist that "ticks off the shot list" on reveal: each 18px check (circle + tick, pathLength=1)
 * strokes on, then its text tracks in 4px, 3f stagger. Static and fully drawn under reduced motion.
 */
export function ShotList({ items, size = "md", className }: ShotListProps) {
  return (
    <ul data-reveal="custom" className={cn("shot-list", size === "lg" && "shot-list-lg", className)}>
      {items.map((item, i) => (
        <li key={item} className="shot-item" style={{ "--i": i } as CSSProperties}>
          <svg className="shot-check" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" pathLength={1} />
            <path d="M5.4 9.3l2.4 2.4 4.8-5.2" pathLength={1} />
          </svg>
          <span className="shot-text">{item}</span>
        </li>
      ))}
    </ul>
  )
}
