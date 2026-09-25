"use client"

import { useEffect, type RefObject } from "react"

/**
 * Development only: walks the ancestors of a sticky element and console.errors if any would break
 * `position: sticky` (overflow hidden/auto/scroll). Use `overflow-clip` instead.
 */
export function useStickyGuard(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    const el = ref.current
    if (!el) return
    let p = el.parentElement
    while (p && p !== document.documentElement) {
      const s = getComputedStyle(p)
      for (const prop of ["overflow", "overflowX", "overflowY"] as const) {
        if (/(hidden|auto|scroll)/.test(s[prop])) {
          console.error(`[sticky-guard] ${prop}: ${s[prop]} on an ancestor breaks position: sticky`, p, el)
          return
        }
      }
      p = p.parentElement
    }
  }, [ref])
}
