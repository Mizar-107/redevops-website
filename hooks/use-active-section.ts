"use client"

import { useSyncExternalStore } from "react"
import { SECTIONS, type SectionId } from "@/lib/sections"

/**
 * One shared IntersectionObserver over every SECTIONS id (rootMargin "-45% 0px -50% 0px", i.e. a
 * thin band just above the viewport centre). Subscribers re-render only when the active section
 * changes.
 */
let active: SectionId = "home"
const listeners = new Set<() => void>()
let io: IntersectionObserver | null = null
let mo: MutationObserver | null = null
const hits = new Map<string, boolean>()

function recompute() {
  let next: SectionId | null = null
  for (const s of SECTIONS) {
    if (hits.get(s.id)) {
      next = s.id
      break
    }
  }
  if (next && next !== active) {
    active = next
    listeners.forEach((cb) => cb())
  }
}

function observeAll() {
  if (!io) return
  for (const s of SECTIONS) {
    const el = document.getElementById(s.id)
    if (el && !el.hasAttribute("data-active-observed")) {
      el.setAttribute("data-active-observed", "")
      io.observe(el)
    }
  }
}

function wire() {
  if (io || typeof window === "undefined") return
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) hits.set(e.target.id, e.isIntersecting)
      recompute()
    },
    { rootMargin: "-45% 0px -50% 0px" },
  )
  observeAll()
  // Sections rendered later (client islands) still get observed.
  let queued = false
  mo = new MutationObserver((records) => {
    if (queued) return
    // ignore text-only mutations (per-frame textContent writes elsewhere on the page)
    if (!records.some((r) => Array.from(r.addedNodes).some((n) => n.nodeType === 1))) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      observeAll()
    })
  })
  mo.observe(document.body, { childList: true, subtree: true })
}

function unwire() {
  io?.disconnect()
  mo?.disconnect()
  io = null
  mo = null
  hits.clear()
  document.querySelectorAll("[data-active-observed]").forEach((el) => el.removeAttribute("data-active-observed"))
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  wire()
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) unwire()
  }
}

export function useActiveSection(): SectionId {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => "home" as SectionId,
  )
}
