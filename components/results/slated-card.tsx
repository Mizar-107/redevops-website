import { cn } from "@/lib/utils"
import { SplitText } from "@/components/motion/split-text"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import s from "./results.module.css"

export type SlatedCardProps = {
  /** "A" | "B" */
  scene: string
  title: string
  body: string
  className?: string
}

/**
 * Example focus as a slated scene. The header is a clapper stick hinged at the left: it waits open,
 * winds up a further −4° (f2, the anticipation), then claps shut from −14° on --spring-clap (f9).
 * On impact the card border flashes signal for f2 (one flash, confined to the card), the title
 * mask-rises and the body fades. All CSS, keyed off this card's own reveal; SSR/still = closed.
 */
export function SlatedCard({ scene, title, body, className }: SlatedCardProps) {
  return (
    <article
      data-reveal="custom"
      className={cn(s.slated, "vf-host relative rounded-xl border border-line bg-ink-900", className)}
    >
      <ViewfinderFrame />
      <span aria-hidden="true" className={s.clapper}>
        <span className={s.stick} />
      </span>
      <span aria-hidden="true" className={s.flash} />

      <div className="px-6 pb-8 pt-10 sm:px-8">
        <p className="font-mono text-slate uppercase text-paper-mute">
          Example focus <span className="text-line-strong">·</span> <span className="text-signal">Scene {scene}</span>
        </p>
        <h3 className="mt-4 text-h3 text-balance text-paper">
          <SplitText text={title} className={s.slatedTitle} />
        </h3>
        <p className={cn(s.slatedBody, "mt-4 text-body text-paper-dim")}>{body}</p>
      </div>
    </article>
  )
}
