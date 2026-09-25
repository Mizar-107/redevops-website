"use client"

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { LazyMotion, MotionConfig, domAnimation, motionValue, useMotionValue, type MotionValue } from "framer-motion"
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
    // LazyMotion + m.* components with the domAnimation feature set only: no layout-projection
    // engine in the bundle. `strict` makes any stray full `motion.*` component throw in dev.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        <ChromeContext.Provider value={chrome}>
          <MotionBoot />
          {children}
        </ChromeContext.Provider>
      </MotionConfig>
    </LazyMotion>
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
    const onEntries = (obs: IntersectionObserver) => (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        // Tall elements can never reach a 35% ratio; accept a 30%-of-viewport visible slice too.
        // Short elements that are fully visible always count.
        if (
          e.intersectionRatio >= 0.35 ||
          e.intersectionRect.height >= window.innerHeight * 0.3 ||
          (e.intersectionRatio > 0.98 && e.boundingClientRect.height > 0)
        ) {
          obs.unobserve(e.target)
          reveal(e.target, false)
        }
      }
    }
    const thresholds = [0, 0.1, 0.2, 0.35, 0.5, 0.99, 1]
    const io: IntersectionObserver = new IntersectionObserver((entries) => onEntries(io)(entries), {
      threshold: thresholds,
      rootMargin: "0px 0px -8% 0px",
    })
    // Elements in the last stretch of the document can never cross the -8% bottom inset (the page
    // can't scroll far enough), so they are observed without it.
    const ioTail: IntersectionObserver = new IntersectionObserver((entries) => onEntries(ioTail)(entries), {
      threshold: thresholds,
    })
    const observe = (el: Element) => {
      const docBottom = document.documentElement.scrollHeight
      const bottom = el.getBoundingClientRect().bottom + window.scrollY
      if (bottom > docBottom - window.innerHeight * 0.12) ioTail.observe(el)
      else io.observe(el)
    }
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
        observe(el)
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

    // Only structural additions of ELEMENTS can bring new reveal/loop nodes. The site writes
    // textContent every scroll frame (OSD timecode, program monitor…), which must not trigger scans.
    let queued = false
    const mo = new MutationObserver((records) => {
      if (queued) return
      const relevant = records.some((r) => {
        for (const n of r.addedNodes) if (n.nodeType === 1) return true
        return false
      })
      if (!relevant) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        scan()
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Keyboard focus must never land inside content that is still hidden by the reveal system:
    // reveal the focused element's unrevealed ancestors instantly.
    const onFocusIn = (ev: FocusEvent) => {
      let el = ev.target instanceof Element ? ev.target : null
      while (el) {
        if (el.hasAttribute("data-reveal") && !el.hasAttribute("data-inview")) {
          io.unobserve(el)
          ioTail.unobserve(el)
          reveal(el, true)
        }
        el = el.parentElement
      }
    }
    document.addEventListener("focusin", onFocusIn)

    return () => {
      io.disconnect()
      ioTail.disconnect()
      loopIO.disconnect()
      mo.disconnect()
      document.removeEventListener("focusin", onFocusIn)
    }
  }, [])
  return null
}
