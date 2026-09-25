/**
 * Services reel scene contract (see the Services stage and components/reel/scenes/*).
 *
 * Each scene is a pure function of its progress v ∈ [0, 1]: seeded randomness, no simulation state,
 * so scrubbing backwards is frame-perfect. The stage draws the shared throughline from keyShape(v);
 * a scene's Furniture draws everything else and NEVER draws the throughline.
 */
import type { MotionValue } from "framer-motion"
import type { ComponentType } from "react"
import type { Pt } from "@/lib/motion/math"

/** Monitor coordinate space (SVG viewBox 0 0 800 500). */
export const MONITOR = { w: 800, h: 500, mid: 250 } as const
export const SIGNAL_POINTS = 96

export type SceneId = "cost" | "reliability" | "delivery" | "partnership"
/** scrub: driven by scroll; play: driven by a time animation of `progress`; static: render once, no subscriptions. */
export type SceneMode = "scrub" | "play" | "static"

export interface SceneProps {
  progress: MotionValue<number>
  mode: SceneMode
  active: boolean
  /** Small render (stacked layout on phones): mono labels at 22 viewBox units instead of 11. */
  compact?: boolean
}

export interface SceneModule {
  id: SceneId
  /** "COST" | "RELIABILITY" | "DELIVERY" | "PARTNERSHIP" */
  label: string
  beats: readonly [string, string, string, string]
  beatAt(v: number): 0 | 1 | 2 | 3
  /** PURE: exactly 96 points in MONITOR coords (x ascending unless documented). */
  keyShape(v: number): Pt[]
  /** 0 = problem (tungsten stroke) … 1 = resolved (signal stroke). */
  resolve(v: number): number
  /** pathD smoothing for the throughline (cost = false: stepped). */
  smooth: boolean
  /** role="img" description. */
  ariaLabel: string
  /**
   * Renders <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full"> (+ optional HTML chips).
   * Initial render must equal the state at progress.get() (pure, SSR-safe).
   * After mount: useMotionValueEvent(progress, "change") → frame.update(() => render(v)) writing attrs via refs.
   * mode "static": render once at progress.get(); no subscriptions, no rAF.
   */
  Furniture: ComponentType<SceneProps>
}

/** Flat line y = 250, x 0..800, 96 points. The throughline at rest. */
export const K0: Pt[] = Array.from({ length: SIGNAL_POINTS }, (_, i) => ({
  x: (MONITOR.w * i) / (SIGNAL_POINTS - 1),
  y: MONITOR.mid,
}))
