"use client"

import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { Hairline } from "@/components/motion/hairline"
import { DUR_MS } from "@/lib/motion/tokens"
import type { SceneModule } from "@/lib/reel/scene"
import { ReelStage } from "./reel-stage"
import { StackedReel } from "./stacked-reel"

/**
 * REEL 02 · SERVICES — the widescreen reel.
 * Intro in normal flow, then two server-rendered layouts of which CSS displays exactly one:
 * the pinned letterbox stage (lg + motion full) or the stacked cards (everything else).
 */
export function ServicesSection({ scenes }: { scenes?: readonly SceneModule[] } = {}) {
  return (
    <section id="services" aria-labelledby="services-title" className="relative">
      {/* the seam the hero's converged line lands on */}
      <Hairline draw="center" className="absolute inset-x-0 top-0" />

      <div className="shell grid gap-6 pb-16 pt-24 md:pb-20 md:pt-32 lg:grid-cols-12 lg:gap-x-8 lg:pb-24">
        <Slate section="services" className="lg:col-span-12" />
        <h2 id="services-title" className="max-w-4xl text-h2 text-balance lg:col-span-7">
          <SplitText text="Practical DevOps help that sticks" />
        </h2>
        <Reveal
          as="p"
          delay={DUR_MS.f6}
          className="max-w-[60ch] text-lede text-paper-dim text-pretty lg:col-span-5 lg:self-end lg:justify-self-end"
        >
          Focused engagements for teams that want clearer spend, steadier systems, and smoother releases. Not another
          generic transformation deck.
        </Reveal>
      </div>

      <ReelStage scenes={scenes} />
      <StackedReel scenes={scenes} />
    </section>
  )
}
