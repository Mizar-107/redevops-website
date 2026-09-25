"use client"

import { useCallback, useSyncExternalStore } from "react"
import { getMotion, setMotion, subscribeMotion } from "@/lib/motion/pref"

const getReduced = () => getMotion() === "reduce"
const getServerReduced = () => false

/** Live motion preference (OS setting + the MOTION toggle). Server/hydration snapshot: not reduced. */
export function useMotionPref(): { reduced: boolean; setReduced(v: boolean): void } {
  const reduced = useSyncExternalStore(subscribeMotion, getReduced, getServerReduced)
  const setReduced = useCallback((v: boolean) => setMotion(!v), [])
  return { reduced, setReduced }
}

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribeMotion, getReduced, getServerReduced)
}
