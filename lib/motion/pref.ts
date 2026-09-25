/**
 * Motion preference store. The pre-paint boot script in app/layout.tsx sets html[data-motion] and
 * html[data-intro]; this module reads and updates them on the client.
 */
import { HERO_T0 } from "./tokens"

export type MotionMode = "full" | "reduce"
export type IntroMode = "play" | "seen" | "skip" | "none"

const STORAGE_KEY = "rdo:motion"
const listeners = new Set<() => void>()
let teardown: (() => void) | null = null

const html = () => (typeof document === "undefined" ? null : document.documentElement)

/** Current mode; "full" if the attribute is absent on the client. */
export function getMotion(): MotionMode {
  const el = html()
  if (!el) return "full"
  return el.getAttribute("data-motion") === "reduce" ? "reduce" : "full"
}

/** Server snapshot. Never branch markup on it. */
export function getServerMotion(): MotionMode {
  return "full"
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function ensureWiring() {
  if (teardown || typeof window === "undefined") return
  const el = document.documentElement
  const mo = new MutationObserver(() => listeners.forEach((cb) => cb()))
  mo.observe(el, { attributes: true, attributeFilter: ["data-motion"] })
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
  const onChange = () => {
    const stored = readStored()
    if (stored === "on" || stored === "off") return
    el.setAttribute("data-motion", mql.matches ? "reduce" : "full")
  }
  mql.addEventListener("change", onChange)
  teardown = () => {
    mo.disconnect()
    mql.removeEventListener("change", onChange)
    teardown = null
  }
}

export function subscribeMotion(cb: () => void): () => void {
  listeners.add(cb)
  ensureWiring()
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0 && teardown) teardown()
  }
}

/** Persist the viewer's choice and apply it live. */
export function setMotion(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off")
  } catch {
    /* private mode etc. — still apply for this page view */
  }
  html()?.setAttribute("data-motion", on ? "full" : "reduce")
}

export function getIntroMode(): IntroMode {
  const v = html()?.getAttribute("data-intro")
  return v === "play" || v === "seen" || v === "skip" ? v : "none"
}

/** Hero timeline origin in ms for the current intro mode (0 when unknown). */
export function heroT0Ms(): number {
  const m = getIntroMode()
  return m === "none" ? 0 : HERO_T0[m]
}

declare global {
  interface Window {
    __rdoIntro?: { t0: number; mode: string }
  }
}

let clockOrigin: number | null = null

/**
 * The intro clock origin in performance.now() time: when the CSS intro animations actually started
 * (first style resolution of <body>). CSS animation start times share performance.now()'s time origin,
 * so this is read from the earliest CSS animation; before any exists it falls back to the boot
 * script's timestamp (which runs slightly earlier, in <head>). Cached once resolved.
 */
export function introClockOrigin(): number {
  if (typeof window === "undefined") return 0
  if (clockOrigin != null) return clockOrigin
  const boot = window.__rdoIntro?.t0 ?? 0
  try {
    if (typeof document.getAnimations === "function" && typeof CSSAnimation !== "undefined") {
      let min = Infinity
      for (const a of document.getAnimations()) {
        if (a instanceof CSSAnimation && typeof a.startTime === "number") min = Math.min(min, a.startTime)
      }
      if (min !== Infinity && min >= boot - 1 && min - boot < 1500) {
        clockOrigin = min
        return min
      }
    }
  } catch {
    /* fall through to the boot timestamp */
  }
  return boot
}

/**
 * Milliseconds from now until `heroT0 + delayMs` on the page's intro clock (the same origin the CSS
 * intro animations use). Never negative.
 */
export function introRemaining(delayMs = 0): number {
  if (typeof window === "undefined") return 0
  return Math.max(0, introClockOrigin() + heroT0Ms() + delayMs - performance.now())
}
