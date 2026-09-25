"use client"

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { MotionConfig, motionValue, useMotionValue, type MotionValue } from "framer-motion"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"

export type Chrome = {
  /** 0..1 — how far the widescreen letterbox is engaged. Written only by the Services reel. */
  letterbox: MotionValue<number>
}

const fallbackChrome: Chrome = { letterbox: motionValue(0) }
const ChromeContext = createContext<Chrome>(fallbackChrome)

export function useChrome(): Chrome {
  return useContext(ChromeContext)
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotionSafe()
  const letterbox = useMotionValue(0)
  const chrome = useMemo(() => ({ letterbox }), [letterbox])
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <ChromeContext.Provider value={chrome}>
        <MotionBoot />
        {children}
      </ChromeContext.Provider>
    </MotionConfig>
  )
}

export type RevealEventDetail = { instant: boolean }

/**
 * Drives the CSS reveal system (see app/globals.css "Reveal system"):
 * 1. [data-reveal] elements already in the viewport at hydration get data-inview="instant" (no animation, no flash).
 * 2. html[data-ready] is set, which enables the hidden starting states for everything else.
 * 3. One IntersectionObserver reveals the rest (data-inview="1") and dispatches `rdo:reveal`.
 * 4. [data-loop] elements get data-offscreen toggled so their CSS loops pause.
 * 5. A MutationObserver (rAF-batched) picks up nodes added later.
 */
function MotionBoot() {
  useEffect(() => {
    const html = document.documentElement
    const reveal = (el: Element, instant: boolean) => {
      el.setAttribute("data-inview", instant ? "instant" : "1")
      el.dispatchEvent(new CustomEvent<RevealEventDetail>("rdo:reveal", { detail: { instant } }))
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          // Tall elements can never reach a 35% ratio; accept a 30%-of-viewport visible slice too.
          if (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= window.innerHeight * 0.3) {
            io.unobserve(e.target)
            reveal(e.target, false)
          }
        }
      },
      { threshold: [0, 0.1, 0.2, 0.35, 0.5, 1], rootMargin: "0px 0px -8% 0px" },
    )
    const loopIO = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting)
    })
    const seen = new WeakSet<Element>()
    let booted = false

    const scan = () => {
      const vh = window.innerHeight
      document.querySelectorAll("[data-reveal]:not([data-inview])").forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        if (!booted) {
          const r = el.getBoundingClientRect()
          const visible = r.width + r.height > 0 && r.top < vh && r.bottom > 0
          if (visible) {
            reveal(el, true)
            return
          }
        }
        io.observe(el)
      })
      document.querySelectorAll("[data-loop]").forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        loopIO.observe(el)
      })
    }

    scan()
    booted = true
    html.setAttribute("data-ready", "")

    let queued = false
    const mo = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        scan()
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      loopIO.disconnect()
      mo.disconnect()
    }
  }, [])
  return null
}
