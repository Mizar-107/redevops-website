import { cn } from "@/lib/utils"
import { SplitText } from "@/components/motion/split-text"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import s from "./results.module.css"

export type SlatedCardProps = {
  /** Slate tag after the label: "A" | "B" for examples, a country code for client work */
  scene: string
  title: string
  body: string
  /** Mono label before the tag. Defaults to "Example engagement". */
  label?: string
  className?: string
}

/**
 * Engagement card (example scopes and real client work share it). On reveal a signal line draws
 * across the top edge (f12, cut), the card border flashes once (f2, confined to the card), the
 * title mask-rises and the body fades.
 * All CSS, keyed off this card's own reveal; SSR/still = final state.
 */
export function SlatedCard({ scene, title, body, label = "Example engagement", className }: SlatedCardProps) {
  return (
    <article
      data-reveal="custom"
      className={cn(s.slated, "vf-host relative rounded-xl border border-line bg-ink-900", className)}
    >
      <ViewfinderFrame />
      <span aria-hidden="true" className={s.topbar}>
        <span className={s.bar} />
      </span>
      <span aria-hidden="true" className={s.flash} />

      <div className="px-6 pb-8 pt-10 sm:px-8">
        <p className="font-mono text-slate uppercase text-paper-mute">
          {label} <span className="text-line-strong">·</span> <span className="text-signal">{scene}</span>
        </p>
        <h3 className="mt-4 text-h3 text-balance text-paper">
          <SplitText text={title} className={s.slatedTitle} />
        </h3>
        <p className={cn(s.slatedBody, "mt-4 text-body text-paper-dim")}>{body}</p>
      </div>
    </article>
  )
}
