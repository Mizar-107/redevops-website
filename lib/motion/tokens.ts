/**
 * THROUGHLINE motion language.
 * Every duration, easing, stagger and spring on the site comes from here (or the CSS mirrors in
 * app/globals.css). Time is counted in 24 fps film frames: f(12) === 0.5s.
 */

export const FPS = 24

/** Frames → seconds (framer-motion units). */
export const f = (n: number) => n / FPS
/** Frames → milliseconds. */
export const fms = (n: number) => Math.round((n / FPS) * 1000)

/** Named easings. Identical cubic-beziers are exposed in CSS as --ease-*. */
export const EASE = {
  /** expo-out: anything entering from behind a matte (default) */
  title: [0.16, 1, 0.3, 1],
  /** quart-in-out: wipes, bars, blade, panels, clip edges */
  cut: [0.76, 0, 0.24, 1],
  /** expo-in-out: letterbox open/close, iris, signal morphs */
  iris: [0.87, 0, 0.13, 1],
  /** expo-in: anything leaving the frame */
  exit: [0.7, 0, 0.84, 0],
  /** back-out: ONLY elements < 64px, stamps, diamonds, checks */
  clap: [0.34, 1.56, 0.64, 1],
  /** sine-in-out: idle loops only */
  drift: [0.45, 0, 0.55, 1],
  /** UI state (header morph, details open) */
  ui: [0.22, 1, 0.36, 1],
} as const

export type EaseName = keyof typeof EASE

export const EASE_CSS: Record<EaseName, string> = Object.fromEntries(
  Object.entries(EASE).map(([k, v]) => [k, `cubic-bezier(${v.join(", ")})`]),
) as Record<EaseName, string>

/** Durations in seconds, keyed by frame count. */
export const DUR = {
  f1: f(1),
  f2: f(2),
  f3: f(3),
  f4: f(4),
  f6: f(6),
  f9: f(9),
  f12: f(12),
  f14: f(14),
  f18: f(18),
  f24: f(24),
  f36: f(36),
} as const

/** Durations in milliseconds, keyed by frame count. */
export const DUR_MS = {
  f1: fms(1),
  f2: fms(2),
  f3: fms(3),
  f4: fms(4),
  f6: fms(6),
  f9: fms(9),
  f12: fms(12),
  f14: fms(14),
  f18: fms(18),
  f24: fms(24),
  f36: fms(36),
} as const

/** Stagger steps in seconds. */
export const STAGGER = { char: f(1), word: f(2), line: f(3), card: f(4) } as const
/** Total stagger for any group is capped at f12 (0.5s). */
export const STAGGER_CAP = f(12)
/** Per-item step for a group of n, honouring the cap. Works in any unit as long as step and cap agree. */
export const staggerFor = (n: number, step: number, cap: number = STAGGER_CAP) =>
  Math.min(step, cap / Math.max(1, n))

/**
 * framer-motion springs. Use as `useSpring(v, SPRING.follow)` or
 * `transition={{ type: "spring", ...SPRING.clap }}`.
 */
export const SPRING = {
  /** smooths every scroll-derived value */
  follow: { stiffness: 140, damping: 30, mass: 0.8, restDelta: 0.0005 },
  /** CTA inner-label pull */
  magnet: { stiffness: 260, damping: 18, mass: 0.4 },
  /** nav playhead (layoutId), OSD */
  hud: { stiffness: 400, damping: 40, mass: 1 },
  /** == --spring-clap */
  clap: { stiffness: 420, damping: 20, mass: 0.6 },
  /** == --spring-snap */
  snap: { stiffness: 520, damping: 34, mass: 0.6 },
} as const

/** Cold open overlay timeline (ms from first paint). Mirrored in cold-open.module.css. */
export const COLD_OPEN = {
  total: 1450,
  slateIn: 0,
  lineDraw: [120, 520],
  blip: [480, 800],
  part: [700, 1100],
  hold: [1100, 1280],
  exit: [1280, 1450],
  skipExit: 200,
} as const

/** Hero timeline origin (ms from first paint) per html[data-intro]. CSS var --hero-t0. */
export const HERO_T0 = { play: 700, seen: 60, skip: 0 } as const

/** Hero choreography (ms after --hero-t0). */
export const HERO = {
  slate: 0,
  line1: 120,
  line2: 360,
  lede: 1200,
  blade: 1360,
  bladeHold: 83,
  bladeSweep: 560,
  sliceHold: 125,
  heal: 375,
  ctas: 1400,
  cue: 2100,
} as const

/** Pinned stage heights in svh. Must match the class strings (lg:fx:h-[360svh] / lg:fx:h-[240svh]). */
export const PIN = { servicesSvh: 360, processSvh: 240 } as const
