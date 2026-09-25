import { Handshake, Map, Search, type LucideIcon } from "lucide-react"

/**
 * 03 / PROCESS: the engagement plan. Three steps = three phase bars on a project timeline.
 * Log lines are paraphrased only from the step copy.
 */

export type StepIndex = 0 | 1 | 2
export type Track = "V1" | "V2" | "V3"

export type ProcessStep = {
  index: StepIndex
  icon: LucideIcon
  title: string
  description: string
  /** internal lane key */
  track: Track
  /** lane name shown on the timeline */
  lane: string
  /** clip in/out on the sequence, as a fraction of the timeline (0..1) */
  clip: readonly [number, number]
  /** two run-log lines typed into the program monitor */
  log: readonly [string, string]
}

export const STEPS: readonly ProcessStep[] = [
  {
    index: 0,
    icon: Search,
    title: "Discover & diagnose",
    description:
      "A free 30-minute call to align on goals, then a focused review of spend, reliability signals, and delivery bottlenecks. We fix the right problems first.",
    track: "V1",
    lane: "DISCOVER",
    clip: [0, 0.38],
    log: ["› discover: goals aligned on a free 30-minute call", "› diagnose: spend, reliability signals, delivery bottlenecks"],
  },
  {
    index: 1,
    icon: Map,
    title: "Plan & implement",
    description:
      "A clear, prioritized plan with owners and sequencing. We implement alongside your team with minimal disruption to product work.",
    track: "V2",
    lane: "BUILD",
    clip: [0.3, 0.72],
    log: ["› plan: prioritized actions, owners, sequencing", "› implement: alongside your team, minimal disruption"],
  },
  {
    index: 2,
    icon: Handshake,
    title: "Stabilize & hand over",
    description:
      "We tune what we shipped, document how it works, and pair with your engineers so the gains stick after the engagement ends.",
    track: "V3",
    lane: "HANDOVER",
    clip: [0.64, 1],
    log: ["› stabilize: tune, document, pair with your engineers", "› hand over: gains that stick after the engagement"],
  },
]

/** The line the run log ends on once the playhead reaches the end of the sequence. */
export const END_LOG = "› all steps complete: ready for handover"

/**
 * Where the pinned edit plays: lg width AND at least 600px tall. Below that height the monitor
 * (bound to the space above the timeline) is too small to hold a step's title and description, so
 * short screens get the stacked edit. Mirrors `.pinWrap` / `.pinStage` / `.stackWrap` in the module.
 */
export const PIN_MQ = "(min-width: 1024px) and (min-height: 600px)"

/** Major ruler ticks every 10% of the sequence. */
export const RULER_MAJORS = 10

/** Where a clip button lands the playhead (fraction of the pin's scroll span). */
export const JUMP = [0.17, 0.51, 0.84] as const

/** End latch: on at p ≥ .97, off again only below .95 (hysteresis, so it never flickers). */
export const END_ON = 0.97
export const END_OFF = 0.95

/** Step for a playhead position. Boundaries sit inside the clip overlaps (cross-dissolves). */
export const stepAt = (p: number): StepIndex => (p < 0.34 ? 0 : p < 0.68 ? 1 : 2)

export const pad2 = (n: number) => String(n).padStart(2, "0")
/** "01 / 03" */
export const stepCount = (i: number) => `${pad2(i + 1)} / ${pad2(STEPS.length)}`
/** "STEP 01 · DISCOVER" */
export const clipLabel = (s: ProcessStep) => `STEP ${pad2(s.index + 1)} · ${s.lane}`
/** Plan progress as a mono bar ("■■■■□□□□□□□□") for a timeline fraction. No numbers, no timecode. */
const BAR_CELLS = 12
export const planBar = (x: number) => {
  const n = Math.round(Math.min(1, Math.max(0, x)) * BAR_CELLS)
  return "■".repeat(n) + "□".repeat(BAR_CELLS - n)
}
/** Ruler labels: only the ends are named. */
export const rulerLabel = (i: number) => (i === 0 ? "KICKOFF" : i === RULER_MAJORS ? "HANDOVER" : "")
/** "Jump to step 2: Plan & implement" */
export const jumpLabel = (s: ProcessStep) => `Jump to step ${s.index + 1}: ${s.title}`
