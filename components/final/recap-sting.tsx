"use client"

import { useEffect, useRef, type CSSProperties, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { lerp, mulberry32, smoothstep, type Pt } from "@/lib/motion/math"
import { DUR_MS, EASE_CSS } from "@/lib/motion/tokens"
import { section } from "@/lib/sections"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import type { RevealEventDetail } from "@/components/motion/motion-provider"
import s from "./final.module.css"

/* =====================================================================================
   Four static motifs, one per service, drawn in the monitor's own 180 × 112 space. Every motif
   carries the throughline on the monitor's centre row (y ≈ 56) so the collapse reads as one line.
   Deterministic (seeded), SSR-identical.
   ===================================================================================== */
const W = 180
const MID = 56
const SIGNAL = "#22D3EE"
const r1 = (v: number) => Math.round(v * 10) / 10
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${r1(p.x)} ${r1(p.y)}`).join("")

/** the site's glow recipe: halo (same path, wide, 14%) under a 1.5px core, round caps, no filters */
function Trace({ d, dashed }: { d: string; dashed?: boolean }) {
  return (
    <>
      <path d={d} stroke={SIGNAL} strokeOpacity={0.14} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        stroke={SIGNAL}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "3 3" : undefined}
      />
    </>
  )
}

/* 01 COST: compacted bill columns under the ghost of the old silhouette */
const COST = (() => {
  const rand = mulberry32(31)
  const base = 86
  const cols = Array.from({ length: 9 }, (_, i) => {
    const x = 20 + i * 16
    const c = Math.round(lerp(13, 20, rand()))
    const st = Math.round(lerp(5, 9, rand()))
    const old = c + st + Math.round(lerp(12, 34, rand()))
    return { x, c, st, top: base - c - st, oldTop: base - old }
  })
  const step = (key: "top" | "oldTop") => {
    let d = `M12 ${cols[0][key]}`
    cols.forEach((col, i) => {
      if (i) d += `V${col[key]}`
      d += `H${i === cols.length - 1 ? 168 : col.x + 13}`
    })
    return d
  }
  return { base, cols, now: step("top"), ghost: step("oldTop") }
})()

function CostMotif() {
  return (
    <svg viewBox={`0 0 ${W} 112`} fill="none">
      {/* header strip: a label redaction on the left, the total bar (shrunk) with its old length */}
      <rect x={12} y={14} width={30} height={3} rx={1} fill="#5D6677" opacity={0.55} />
      <rect x={112} y={14} width={56} height={3} rx={1} stroke="#5D6677" strokeOpacity={0.5} strokeDasharray="2 2" />
      <rect x={112} y={14} width={31} height={3} rx={1} fill={SIGNAL} />
      <line x1={12} y1={COST.base + 0.5} x2={168} y2={COST.base + 0.5} stroke="#2A3242" />
      {COST.cols.map((col) => (
        <g key={col.x}>
          <rect x={col.x} y={COST.base - col.c} width={10} height={col.c} fill="#0E7490" fillOpacity={0.55} />
          <rect x={col.x} y={col.top} width={10} height={col.st - 1} fill="#8B5CF6" fillOpacity={0.4} />
        </g>
      ))}
      <path d={COST.ghost} stroke="#9AA3B2" strokeOpacity={0.45} strokeDasharray="2 2.5" />
      <Trace d={COST.now} />
    </svg>
  )
}

/* 02 RELIABILITY: a calm pulse inside the SLO band, one actionable alert */
const PULSE = (() => {
  // P-QRS-T template, (t, dy)
  const tpl: [number, number][] = [
    [0, 0], [0.1, 0], [0.13, -1.6], [0.16, -2.2], [0.19, -1.4], [0.22, 0], [0.27, 0], [0.295, 2],
    [0.32, -11], [0.345, 4], [0.37, 0], [0.47, 0], [0.51, -2.4], [0.55, -3.1], [0.59, -2.2], [0.63, 0], [1, 0],
  ]
  const period = 38
  const pts: Pt[] = []
  for (let b = 0; b < 4; b++) for (const [t, dy] of tpl) pts.push({ x: 14 + (b + t) * period, y: MID + dy })
  return poly(pts.filter((p, i, a) => i === 0 || p.x > a[i - 1].x))
})()

function ReliabilityMotif() {
  return (
    <svg viewBox={`0 0 ${W} 112`} fill="none">
      <line x1={12} y1={24.5} x2={120} y2={24.5} stroke="#2A3242" strokeDasharray="3 3" />
      <rect x={12} y={43} width={156} height={26} fill={SIGNAL} fillOpacity={0.06} />
      <line x1={12} y1={43.5} x2={168} y2={43.5} stroke={SIGNAL} strokeOpacity={0.35} strokeDasharray="3 3" />
      <line x1={12} y1={68.5} x2={168} y2={68.5} stroke={SIGNAL} strokeOpacity={0.35} strokeDasharray="3 3" />
      {/* the one actionable alert: signal-bordered chip, a check, two redaction lines */}
      <rect x={126.5} y={16.5} width={41} height={13} rx={2.5} fill="#0E121B" stroke={SIGNAL} />
      <path d="M131 23.2l1.8 1.8 3.4-3.6" stroke={SIGNAL} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={140} y={20.5} width={22} height={2} rx={1} fill="#9AA3B2" opacity={0.6} />
      <rect x={140} y={24} width={14} height={2} rx={1} fill="#5D6677" opacity={0.7} />
      <Trace d={PULSE} />
    </svg>
  )
}

/* 03 DELIVERY: a straight track, every stage passed */
const STAGES = [32, 61, 90, 119, 148]
function DeliveryMotif() {
  return (
    <svg viewBox={`0 0 ${W} 112`} fill="none">
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i} fill="#2A3242">
          <rect x={14 + i * 10} y={33} width={4} height={2.5} rx={0.5} />
          <rect x={14 + i * 10} y={76.5} width={4} height={2.5} rx={0.5} />
        </g>
      ))}
      <circle cx={148} cy={MID} r={14} fill={SIGNAL} fillOpacity={0.1} />
      <Trace d={`M12 ${MID}H168`} />
      {STAGES.map((x) => (
        <g key={x}>
          <circle cx={x} cy={MID} r={7.5} fill="#0A0D14" stroke="#34D399" strokeWidth={1.2} />
          <path
            d={`M${x - 3.2} ${MID + 0.2}l2.1 2.1 4.3-4.5`}
            stroke="#34D399"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  )
}

/* 04 PARTNERSHIP: two braided tracks merge into one line; the docs they leave stay pinned */
const BRAID = (() => {
  const team: Pt[] = []
  const recep: Pt[] = []
  for (let i = 0; i <= 76; i++) {
    const xn = i / 76
    const x = 12 + xn * 156
    const m = smoothstep(0.06, 0.56, xn)
    const sep = 14 * (1 - m)
    const braid = 11 * Math.sin(2 * Math.PI * 2 * xn) * (1 - m)
    recep.push({ x, y: MID + sep / 2 + braid / 2 })
    if (xn <= 0.62) team.push({ x, y: MID - sep / 2 - braid / 2 })
  }
  return { team: poly(team), recep: poly(recep) }
})()
const DOCS = [100, 124, 148]

function PartnershipMotif() {
  return (
    <svg viewBox={`0 0 ${W} 112`} fill="none">
      <path d={BRAID.team} stroke="#9AA3B2" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <Trace d={BRAID.recep} />
      {DOCS.map((x) => (
        <g key={x}>
          <path
            d={`M${x - 4} 43.5h4.8l2.7 2.7v7.8h-7.5z`}
            fill="#0A0D14"
            stroke="#9AA3B2"
            strokeLinejoin="round"
          />
          <path d={`M${x + 0.8} 43.5v2.7h2.7`} stroke="#9AA3B2" strokeLinejoin="round" />
          <circle cx={x - 0.2} cy={MID} r={1.6} fill={SIGNAL} />
        </g>
      ))}
    </svg>
  )
}

type Motif = { key: string; label: string; Art: () => React.JSX.Element }
/** Labels match the Services chapter buttons (01 COST … 04 PARTNERSHIP). */
const MOTIFS: readonly Motif[] = [
  { key: "cost", label: "COST", Art: CostMotif },
  { key: "reliability", label: "RELIABILITY", Art: ReliabilityMotif },
  { key: "delivery", label: "DELIVERY", Art: DeliveryMotif },
  { key: "partnership", label: "PARTNERSHIP", Art: PartnershipMotif },
]
const idx = (k: number) => String(k + 1).padStart(2, "0")
const CUT_TO = `CUT TO · ${section("final").cut.toUpperCase()}`

export type RecapStingProps = {
  /** a data-reveal="custom" element; its reveal (the section is about half in view) rolls the sting */
  sentinelRef: RefObject<HTMLElement | null>
  /** wraps the booking CTA; its [data-cta-underline] is where the line lands */
  targetRef: RefObject<HTMLElement | null>
  /**
   * Light the booking button. `sync` is true when the flying line lands: the caller must commit
   * synchronously (flushSync) so the underline is lit in the same frame the flyer disappears.
   */
  onLand: (sync: boolean) => void
  className?: string
}

/**
 * The recap sting (aria-hidden): a 180 × 112 monitor that hard-cuts through the four service motifs
 * (f9 each, one f1 8% white flash per cut, confined to the monitor), collapses the last one to a
 * single line (art scaleY → 0, line scaleX 1 → .6, f9 cut), and then hands that line — a detached
 * .hairline FLIPped from the monitor to the booking button's underline slot (translate + scaleX, f18
 * title) — to the CTA, which lights. The flight waits until the button is fully on screen, so the
 * payoff is never played to an empty viewport. The cuts are CSS animations started in one style
 * pass; JS only flips data-state and runs the one WAAPI flight. No rAF loop.
 * still (no JS / reduced / MOTION off): the final frame (the merged braid), button lit.
 */
export function RecapSting({ sentinelRef, targetRef, onLand, className }: RecapStingProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const clineRef = useRef<HTMLSpanElement>(null)
  const flyerRef = useRef<HTMLSpanElement>(null)
  const landRef = useRef(onLand)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    landRef.current = onLand
  })

  useEffect(() => {
    const root = rootRef.current
    const sentinel = sentinelRef.current
    const line = clineRef.current
    const flyer = flyerRef.current
    if (!root || !sentinel || !line || !flyer) return

    let disposed = false
    let io: IntersectionObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let flight: Animation | undefined
    const underline = () => targetRef.current?.querySelector<HTMLElement>("[data-cta-underline]") ?? null

    /** skip to the end: last motif, button lit (reduced motion, already in view at load, no target) */
    const finish = () => {
      flight?.cancel()
      flyer.style.opacity = "0"
      if (root.getAttribute("data-state") !== "done") root.setAttribute("data-state", "final")
      landRef.current(false)
    }

    const state = root.getAttribute("data-state")
    if (state === "done" || state === "final") return
    if (reduced || state) {
      // reduced motion, or the preference flipped mid-roll: jump to the final frame
      finish()
      return
    }

    const land = (u: HTMLElement) => {
      if (disposed) return
      // object constancy: the underline appears at full width in the very frame the flyer leaves
      u.style.transition = "none"
      landRef.current(true)
      flyer.style.opacity = "0"
      flight?.cancel()
      root.setAttribute("data-state", "done")
      requestAnimationFrame(() => requestAnimationFrame(() => (u.style.transition = "")))
    }

    const fly = () => {
      const u = underline()
      const host = flyer.offsetParent as HTMLElement | null
      if (disposed || !u || !host) return finish()
      const hr = host.getBoundingClientRect()
      const sr = line.getBoundingClientRect()
      const ur = u.getBoundingClientRect() // scaleX(0) from the left: left/top are exact
      const uw = parseFloat(getComputedStyle(u).width) || ur.width
      // the CTA row may still be finishing its rise: land where it will rest
      let rowY = 0
      const row = targetRef.current
      const tf = row ? getComputedStyle(row).transform : "none"
      if (tf && tf !== "none") rowY = new DOMMatrixReadOnly(tf).m42
      const left = ur.left - hr.left
      const top = ur.top - hr.top - rowY
      flyer.style.left = `${left}px`
      flyer.style.top = `${top}px`
      flyer.style.width = `${uw}px`
      const fx = sr.left - hr.left - left
      const fy = sr.top - hr.top - top
      const sx = Math.max(0.001, sr.width / Math.max(1, uw))
      root.setAttribute("data-state", "flight")
      flyer.style.opacity = "1"
      flight = flyer.animate(
        [
          { transform: `translate3d(${fx}px, ${fy}px, 0) scaleX(${sx})` },
          { transform: "translate3d(0, 0, 0) scaleX(1)" },
        ],
        { duration: DUR_MS.f18, easing: EASE_CSS.title, fill: "both" },
      )
      flight.onfinish = () => land(u)
    }

    /** hold the single line in the monitor until the button (and its underline) is fully on screen */
    const awaitTarget = () => {
      const anchor = underline()?.closest("a")
      if (!anchor) return finish()
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1]
          if (!e.isIntersecting || e.intersectionRatio < 0.98) return
          io?.disconnect()
          fly()
        },
        { threshold: [0, 0.5, 0.98, 1], rootMargin: "0px 0px -20px 0px" },
      )
      io.observe(anchor)
    }

    let readied = false
    const ready = () => {
      if (readied || disposed) return
      readied = true
      clearTimeout(timer)
      line.removeEventListener("animationend", onLineEnd)
      timer = setTimeout(awaitTarget, DUR_MS.f2) // one beat of stillness on the single line
    }
    const onLineEnd = (e: AnimationEvent) => {
      if (e.animationName.includes("sting-line")) ready()
    }

    const play = () => {
      if (disposed) return
      root.setAttribute("data-state", "play")
      line.addEventListener("animationend", onLineEnd)
      timer = setTimeout(ready, DUR_MS.f9 * 5 + 400) // fallback if animationend never arrives
    }

    const onReveal = (e: Event) => {
      if ((e as CustomEvent<RevealEventDetail>).detail?.instant) finish()
      else play()
    }
    const inview = sentinel.getAttribute("data-inview")
    if (inview === "instant") finish()
    else if (inview === "1") play()
    else sentinel.addEventListener("rdo:reveal", onReveal, { once: true })

    return () => {
      disposed = true
      sentinel.removeEventListener("rdo:reveal", onReveal)
      line.removeEventListener("animationend", onLineEnd)
      clearTimeout(timer)
      io?.disconnect()
      flight?.cancel()
      flyer.style.opacity = "0"
    }
  }, [reduced, sentinelRef, targetRef])

  return (
    <>
      <div ref={rootRef} aria-hidden="true" className={cn(s.sting, className)}>
        <div className={cn("vf-host", s.monitor)}>
          <div className={s.screen}>
            <span className={s.standby} />
            {MOTIFS.map(({ key, Art }, k) => (
              <div key={key} className={cn(s.frame, k === 3 && s.frameLast)} style={{ "--k": k } as CSSProperties}>
                <Art />
                <span className={s.flash} />
              </div>
            ))}
            <span ref={clineRef} className={cn("hairline", s.cline)} />
            <span className={s.ghost} />
          </div>
          <ViewfinderFrame always />
        </div>
        <p className={s.stingMeta}>
          <span>RECAP</span>
          <span className={s.labels}>
            <span className={cn(s.lab, s.labStandby)}>STANDBY</span>
            {MOTIFS.map(({ key, label }, k) => (
              <span
                key={key}
                className={cn(s.lab, k === 3 ? s.labFinal : s.labMotif)}
                style={{ "--k": k } as CSSProperties}
              >
                <b>{idx(k)}</b> {label}
              </span>
            ))}
            <span className={cn(s.lab, s.labOut)}>{CUT_TO}</span>
          </span>
        </p>
      </div>
      {/* the detached throughline; positioned in the content block's space at flight time */}
      <span ref={flyerRef} aria-hidden="true" className={cn("hairline", s.flyer)} />
    </>
  )
}
