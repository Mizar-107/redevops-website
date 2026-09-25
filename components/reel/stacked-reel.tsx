"use client"

import { useEffect, useRef } from "react"
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { EASE } from "@/lib/motion/tokens"
import { getMotion } from "@/lib/motion/pref"
import type { SceneModule } from "@/lib/reel/scene"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import type { RevealEventDetail } from "@/components/motion/motion-provider"
import { SplitText } from "@/components/motion/split-text"
import { Reveal } from "@/components/motion/reveal"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { SCENES } from "./scenes"
import { SERVICES } from "./services-data"
import { SceneFrame, TagLine } from "./scene-frame"
import styles from "./reel.module.css"

const pad2 = (n: number) => String(n).padStart(2, "0")

/* Stacked monitors are never wider than ~62% of the shell (still, lg) or a phone/tablet column,
   so scene labels always render in compact (22 viewBox units) mode. */
const COMPACT = true

type Service = (typeof SERVICES)[number]

function StackedCard({ service, scene, index }: { service: Service; scene: SceneModule; index: number }) {
  const monRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<(HTMLSpanElement | null)[]>([])
  const v = useMotionValue(1) // SSR / no-JS: the resolved after-state
  const before = useMotionValue(0) // still: the static "before" thumbnail
  const reduced = useReducedMotionSafe()
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const lastTag = SERVICES[index].tags.length - 1

  // Motion full: a card that starts below the fold rewinds to v = 0 and plays once on reveal.
  useEffect(() => {
    const el = monRef.current
    if (!el || getMotion() !== "full") return
    const r = el.getBoundingClientRect()
    if (r.height > 0 && r.top >= window.innerHeight) v.set(0)
    let played = false
    const onReveal = (e: Event) => {
      if (played || (e as CustomEvent<RevealEventDetail>).detail?.instant) return
      played = true
      if (v.get() < 1) anim.current = animate(v, 1, { duration: 2.5, ease: [...EASE.drift] })
    }
    el.addEventListener("rdo:reveal", onReveal)
    return () => el.removeEventListener("rdo:reveal", onReveal)
  }, [v])

  // MOTION switched off mid-way: land on the after-state.
  useEffect(() => {
    if (!reduced) return
    anim.current?.stop()
    v.set(1)
  }, [reduced, v])

  useEffect(() => () => anim.current?.stop(), [])

  // The active beat follows the scene as it plays (attribute writes on change only). Runs after
  // the rewind effect above, so it first syncs to the current v (a rewound card shows beat 0).
  useEffect(() => {
    let cur = lastTag
    const sync = (x: number) => {
      const b = Math.min(scene.beatAt(x), lastTag)
      if (b === cur) return
      tagsRef.current[cur]?.removeAttribute("data-on")
      tagsRef.current[b]?.setAttribute("data-on", "")
      cur = b
    }
    sync(v.get())
    return v.on("change", sync)
  }, [v, scene, lastTag])

  return (
    <li className={cn(styles.card, "grid gap-7 md:grid-cols-12 md:items-center md:gap-8")}>
      <div className="md:col-span-5">
        <p className={styles.stackNumeral} aria-hidden="true">
          {pad2(index + 1)}
        </p>
        <h3 className="mt-4 text-h3 text-paper text-balance">
          <SplitText text={service.title} />
        </h3>
        <Reveal as="p" className="mt-4 max-w-[44ch] text-body text-paper-dim">
          {service.description}
        </Reveal>
        <TagLine
          className="mt-5"
          tags={service.tags}
          initialOn={lastTag}
          beatRef={(el, b) => {
            tagsRef.current[b] = el
          }}
        />
      </div>

      <div className="md:col-span-7 still:md:flex still:md:items-end still:md:gap-5">
        {/* still: before thumbnail (diptych) — above on phones, beside from md */}
        <div className={cn(styles.thumbWrap, "mb-5 fx:hidden still:block md:mb-0")} aria-hidden="true">
          <p className="mb-2 font-mono text-hud uppercase text-paper-mute">Before</p>
          <div className={cn(styles.thumb, "overflow-clip rounded-[6px] border border-line bg-ink-900")}>
            <SceneFrame scene={scene} mode="static" progress={before} compact={COMPACT} active={false} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-2 font-mono text-hud uppercase text-paper-mute" aria-hidden="true">
            <span className="still:hidden">MON · <span className="text-paper-dim">{scene.label}</span></span>
            <span className="hidden still:inline">After</span>
          </p>
          <div
            ref={monRef}
            data-reveal="custom"
            role="img"
            aria-label={scene.ariaLabel}
            className={cn("vf-host", styles.stackMonitor)}
          >
            <ViewfinderFrame always />
            <div className="absolute inset-0 overflow-clip rounded-[6px] border border-line bg-ink-900">
              <SceneFrame scene={scene} mode="play" progress={v} compact={COMPACT} />
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * The stacked reel: <lg, reduced motion, or no JS. Four cards, each with its own monitor.
 * Motion full: scenes play once on reveal. Still: a before/after diptych.
 */
export function StackedReel({ className, scenes = SCENES }: { className?: string; scenes?: readonly SceneModule[] }) {
  return (
    <div className={cn("lg:fx:hidden", className)}>
      <ol className="shell grid gap-20 pb-24 md:gap-24 md:pb-32">
        {SERVICES.map((s, i) => (
          <StackedCard key={s.id} service={s} scene={scenes[i]} index={i} />
        ))}
      </ol>
    </div>
  )
}
