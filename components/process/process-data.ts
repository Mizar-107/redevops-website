import { Handshake, Map, Search, type LucideIcon } from "lucide-react"
import { formatTC } from "@/lib/motion/math"

/**
 * REEL 04 · PROCESS — "The Edit". Three steps = three clips on an NLE timeline.
 * Titles and descriptions are verbatim from the previous section (the "1." prefixes moved into the
 * clip labels). Log lines are paraphrased only from that copy.
 */

export type StepIndex = 0 | 1 | 2
export type Track = "V1" | "V2" | "V3"

export type ProcessStep = {
  index: StepIndex
  icon: LucideIcon
  title: string
  description: string
  /** video track the clip sits on */
  track: Track
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
      "A free 30-minute call to align on goals, then a focused review of spend, reliability signals, and delivery bottlenecks — so we fix the right problems first.",
    track: "V1",
    clip: [0, 0.38],
    log: ["› discover — goals aligned on a free 30-minute call", "› diagnose — spend, reliability signals, delivery bottlenecks"],
  },
  {
    index: 1,
    icon: Map,
    title: "Plan & implement",
    description:
      "A clear, prioritized action plan with owners and sequencing. We implement alongside your team with minimal disruption to day-to-day product work.",
    track: "V2",
    clip: [0.3, 0.72],
    log: ["› plan — prioritized actions, owners, sequencing", "› implement — alongside your team, minimal disruption"],
  },
  {
    index: 2,
    icon: Handshake,
    title: "Stabilize & hand over",
    description:
      "Tune what we shipped, document how it works, and pair with your engineers so the gains stick long after the engagement ends.",
    track: "V3",
    clip: [0.64, 1],
    log: ["› stabilize — tune, document, pair with your engineers", "› hand over — gains that stick after the engagement"],
  },
]

/** The line the run log ends on once the playhead reaches the end of the sequence. */
export const END_LOG = "› render complete — ready for handover"

/** Sequence length in frames (the timecode readout runs 00:00:00:00 → 00:01:30:00). */
export const SEQ_FRAMES = 2160
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
/** "CLIP 01 · V1" */
export const clipLabel = (s: ProcessStep) => `CLIP ${pad2(s.index + 1)} · ${s.track}`
/** Sequence timecode at a timeline fraction. */
export const tcAt = (x: number) => formatTC(Math.round(x * SEQ_FRAMES))
/** "Jump to step 2: Plan & implement" */
export const jumpLabel = (s: ProcessStep) => `Jump to step ${s.index + 1}: ${s.title}`
