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

/**
 * Milliseconds from now until `heroT0 + delayMs` on the page's intro clock (which starts when the
 * boot script ran, i.e. the same origin CSS intro animations use). Never negative.
 */
export function introRemaining(delayMs = 0): number {
  if (typeof window === "undefined") return 0
  const t0 = window.__rdoIntro?.t0 ?? 0
  return Math.max(0, t0 + heroT0Ms() + delayMs - performance.now())
}
