"use client"

import { useImperativeHandle, useRef, type Ref } from "react"
import { ease, lerp, seg } from "@/lib/motion/math"
import { MONITOR } from "@/lib/reel/scene"
import styles from "./reel.module.css"

/**
 * Editorial transitions between the four scenes. Each is a pure function of the transition progress
 * w ∈ [0, 1] and uses transform-based panels (the iris is the one clip-path, on one element).
 * Index c is the transition c → c+1.
 */
export type TransitionKind = "bar" | "iris" | "blinds"
export const TRANSITIONS: readonly TransitionKind[] = ["bar", "iris", "blinds"]

const BLINDS = 7
const BLIND_STAGGER = 0.04
/** iris radius at w = 1, as a % of the reference box diagonal/√2 (≥ 70.8% covers the corners) */
const IRIS_MAX = 76
/** the monitor's reference radius for circle() percentages, in viewBox units */
const IRIS_REF = Math.hypot(MONITOR.w, MONITOR.h) / Math.SQRT2

export type TransitionHandle = {
  /**
   * Write the transition state for chapter c at transition progress w (0 = none) onto the panels
   * and the four scene layers (visibility, opacity, the iris clip). Identical writes are skipped.
   */
  apply(c: number, w: number, layers: readonly (HTMLElement | null)[]): void
}

type LayerState = { vis: string; op: string; clip: string }

export function TransitionPanels({ ref }: { ref?: Ref<TransitionHandle> }) {
  const barRef = useRef<HTMLDivElement>(null)
  const leadRef = useRef<HTMLSpanElement>(null)
  const trailRef = useRef<HTMLSpanElement>(null)
  const blindRefs = useRef<(HTMLDivElement | null)[]>([])
  const ringRef = useRef<SVGCircleElement>(null)
  const layerCache = useRef<LayerState[]>([])
  const written = useRef(new WeakMap<Element, Record<string, string>>())

  /** Write a style property (or an SVG attribute when attr) only when it changed. */
  const put = (el: HTMLElement | SVGElement | null, key: string, value: string, attr = false) => {
    if (!el) return
    let rec = written.current.get(el)
    if (!rec) written.current.set(el, (rec = {}))
    if (rec[key] === value) return
    rec[key] = value
    if (attr) el.setAttribute(key, value)
    else el.style.setProperty(key, value)
  }

  useImperativeHandle(
    ref,
    () => ({
      apply(c, w, layers) {
        const kind = w > 0 && c < TRANSITIONS.length ? TRANSITIONS[c] : null
        const swapped = w >= 0.5

        // ---- scene layers
        for (let i = 0; i < layers.length; i++) {
          const el = layers[i]
          if (!el) continue
          let vis = false
          let op = 1
          let clip = "none"
          if (i === c) {
            vis = !(kind && kind !== "iris" && swapped)
            if (kind === "iris") op = lerp(1, 0.4, ease.iris(seg(w, 0, 0.6)))
          } else if (kind && i === c + 1) {
            if (kind === "iris") {
              vis = true
              clip = `circle(${(ease.iris(w) * IRIS_MAX).toFixed(3)}% at 50% 50%)`
            } else vis = swapped
          }
          const next: LayerState = { vis: vis ? "visible" : "hidden", op: op.toFixed(3), clip }
          const prev = layerCache.current[i]
          if (!prev || prev.vis !== next.vis) el.style.visibility = next.vis
          if (!prev || prev.op !== next.op) el.style.opacity = next.op
          if (!prev || prev.clip !== next.clip) el.style.clipPath = next.clip === "none" ? "" : next.clip
          layerCache.current[i] = next
        }

        // ---- bar wipe (1 → 2)
        if (kind === "bar") {
          const x = swapped ? ease.cut(seg(w, 0.5, 1)) * 101 : (ease.cut(seg(w, 0, 0.5)) - 1) * 101
          put(barRef.current, "transform", `translate3d(${x.toFixed(2)}%,0,0)`)
          put(leadRef.current, "opacity", swapped ? "0" : "1")
          put(trailRef.current, "opacity", swapped && w < 1 ? "1" : "0")
        } else {
          put(barRef.current, "transform", "translate3d(-101%,0,0)")
          put(leadRef.current, "opacity", "0")
          put(trailRef.current, "opacity", "0")
        }

        // ---- venetian blinds (3 → 4)
        const span = 0.5 - BLIND_STAGGER * (BLINDS - 1)
        for (let k = 0; k < BLINDS; k++) {
          const el = blindRefs.current[k]
          if (!el) continue
          if (kind === "blinds") {
            const a = BLIND_STAGGER * k
            const s = swapped ? 1 - ease.cut(seg(w, 0.5 + a, 0.5 + a + span)) : ease.cut(seg(w, a, a + span))
            put(el, "transform-origin", swapped ? "50% 100%" : "50% 0%")
            put(el, "transform", `scaleY(${s.toFixed(4)})`)
          } else {
            put(el, "transform", "scaleY(0)")
          }
        }

        // ---- iris ring (2 → 3): a hairline riding the iris edge
        const ring = ringRef.current
        if (kind === "iris") {
          const R = (ease.iris(w) * IRIS_MAX * IRIS_REF) / 100
          put(ring, "r", R.toFixed(2), true)
          put(ring, "opacity", (w < 0.02 ? 0 : 1 - seg(w, 0.7, 1)).toFixed(3), true)
        } else {
          put(ring, "opacity", "0", true)
        }
      },
    }),
    [],
  )

  return (
    <div className={styles.panels} aria-hidden="true">
      <div ref={barRef} className={styles.barPanel}>
        <span ref={leadRef} className={`${styles.gate} ${styles.gateLead}`} />
        <span ref={trailRef} className={`${styles.gate} ${styles.gateTrail}`} />
      </div>
      {Array.from({ length: BLINDS }, (_, k) => (
        <div
          key={k}
          ref={(el) => {
            blindRefs.current[k] = el
          }}
          className={styles.blind}
          style={{ top: `${(k * 100) / BLINDS}%`, height: `calc(${100 / BLINDS}% + 1px)` }}
        />
      ))}
      <svg
        className={styles.irisRing}
        viewBox={`0 0 ${MONITOR.w} ${MONITOR.h}`}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <circle
          ref={ringRef}
          cx={MONITOR.w / 2}
          cy={MONITOR.h / 2}
          r={0}
          opacity={0}
          fill="none"
          stroke="#22D3EE"
          strokeOpacity={0.6}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
