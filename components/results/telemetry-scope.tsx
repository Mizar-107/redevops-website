"use client"

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { frame, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import { SPRING } from "@/lib/motion/tokens"
import { clamp, lerp } from "@/lib/motion/math"
import { useScrub } from "@/hooks/use-scrub"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { Hairline } from "@/components/motion/hairline"
import { SCOPE_LANES, SCOPE_SSR, buildScope } from "./scope-signals"
import s from "./results.module.css"

/** Scroll maps onto this slice of the width, so both states are always partly on screen. */
const SWEEP_MIN = 0.06
const SWEEP_MAX = 0.94
/** px per second the feed drifts right → left (untuned signal flows into the scanline). CSS runs it. */
const DRIFT_PX_S = 40
/**
 * The scanline travels inside the glass, this far from each edge, so the handle, its focus ring and
 * VF brackets (±17px) are never clipped at the ends of the range (value 0 / 100).
 */
const TRAVEL_PAD = 20
const travelPad = (w: number) => Math.min(TRAVEL_PAD, w / 4)
/** Chips fade out when they would collide with the panel edge. */
const CHIP_ROOM_L = 104
const CHIP_ROOM_R = 118

const valueText = (n: number) => `Scanline position ${n} of 100`

const ARIA_IMG =
  "Illustration: four signal lanes (spend, alerts, releases, knowledge). Right of the scanline they are untuned: over-provisioned spend, noisy alert spikes, big risky releases and scattered notes. Left of it they are tuned: spend that hugs usage, a few actionable alerts, small regular releases and connected documentation."

/**
 * Telemetry Scope: an illustrative before/after oscilloscope. Four lanes of seeded, periodic
 * signals; untuned right of the scanline, tuned left of it. The sweep follows scroll until the
 * viewer drags the panel or uses the (visually transparent) range input; the feed drifts through
 * the scanline at 40px/s under full motion as a compositor-only CSS animation (.scopeDrift).
 * Sweep writes are transforms through refs, only when the sweep moves: no React renders except on
 * resize, and nothing runs per frame while the page is idle.
 */
export function TelemetryScope({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const hatchId = `scope-hatch-${uid}`

  const panelRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const unOuter = useRef<HTMLDivElement>(null)
  const unInner = useRef<SVGSVGElement>(null)
  const tuOuter = useRef<HTMLDivElement>(null)
  const tuInner = useRef<SVGSVGElement>(null)
  const scanRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const geo = useMemo(
    () => (size ? buildScope(size.w, size.h, 2) : buildScope(SCOPE_SSR.w, SCOPE_SSR.h, 1)),
    [size],
  )

  const reduced = useReducedMotionSafe()
  const st = useRef({ sweep: 0.5, w: 0, override: false, reduced: false, queued: false, shown: -1, chips: "" })
  st.current.reduced = reduced

  // ---------------------------------------------------------------- imperative render
  const apply = useCallback(() => {
    const S = st.current
    S.queued = false
    const w = S.w
    if (!w) return
    const pad = travelPad(w)
    const x = pad + S.sweep * (w - 2 * pad)
    if (unOuter.current) unOuter.current.style.transform = `translate3d(${x}px,0,0)`
    if (unInner.current) unInner.current.style.transform = `translate3d(${-x}px,0,0)`
    if (tuOuter.current) tuOuter.current.style.transform = `translate3d(${x - w}px,0,0)`
    if (tuInner.current) tuInner.current.style.transform = `translate3d(${w - x}px,0,0)`
    const scan = scanRef.current
    if (scan) {
      scan.style.transform = `translate3d(${x}px,0,0)`
      const chips = `${x < CHIP_ROOM_L ? "l" : ""}${w - x < CHIP_ROOM_R ? "r" : ""}`
      if (chips !== S.chips) {
        S.chips = chips
        scan.toggleAttribute("data-hide-l", chips.includes("l"))
        scan.toggleAttribute("data-hide-r", chips.includes("r"))
      }
    }
    // keep the range in step with the scroll-driven sweep (never while the viewer owns it)
    const input = inputRef.current
    if (input && !S.override) {
      const n = Math.round(S.sweep * 100)
      if (n !== S.shown) {
        S.shown = n
        input.value = String(n)
        input.setAttribute("aria-valuetext", valueText(n))
      }
    }
  }, [])

  const schedule = useCallback(() => {
    const S = st.current
    if (S.queued) return
    S.queued = true
    frame.render(apply)
  }, [apply])

  const setSweep = useCallback(
    (v: number) => {
      const S = st.current
      if (Math.abs(v - S.sweep) < 0.0002) return
      S.sweep = v
      schedule()
    },
    [schedule],
  )

  // ---------------------------------------------------------------- measure (resize = the only React render)
  useEffect(() => {
    const el = screenRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[entries.length - 1].contentRect
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      if (!w || !h) return
      st.current.w = w
      setSize((p) => (p && p.w === w && p.h === h ? p : { w, h }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // px transforms replace the SSR percentage transforms before paint
  useLayoutEffect(() => {
    if (size) apply()
  }, [size, apply])

  // ---------------------------------------------------------------- sweep sources
  const { progress } = useScrub(panelRef, ["start 85%", "end 35%"])
  const user = useMotionValue(0.5)
  const userSmooth = useSpring(user, SPRING.follow)

  useMotionValueEvent(progress, "change", (v) => {
    const S = st.current
    if (S.override || S.reduced) return
    setSweep(lerp(SWEEP_MIN, SWEEP_MAX, clamp(v)))
  })
  useMotionValueEvent(userSmooth, "change", (v) => {
    const S = st.current
    if (!S.override || S.reduced) return
    setSweep(clamp(v))
  })

  // initial / motion-preference changes
  useEffect(() => {
    const S = st.current
    if (S.override) return
    S.sweep = reduced ? 0.5 : lerp(SWEEP_MIN, SWEEP_MAX, clamp(progress.get()))
    schedule()
  }, [reduced, progress, schedule])

  const engage = useCallback(
    (target: number) => {
      const S = st.current
      const t = clamp(target)
      if (!S.override) {
        S.override = true
        userSmooth.jump(S.sweep)
        user.jump(S.sweep)
      }
      const input = inputRef.current
      const n = Math.round(t * 100)
      if (input) {
        if (input.value !== String(n)) input.value = String(n)
        input.setAttribute("aria-valuetext", valueText(n))
      }
      if (S.reduced) {
        user.jump(t)
        setSweep(t)
      } else user.set(t)
    },
    [user, userSmooth, setSweep],
  )

  // ---------------------------------------------------------------- pointer: drag anywhere on the panel
  const drag = useRef<{ id: number; x0: number; y0: number; active: boolean; touch: boolean } | null>(null)
  const xToSweep = (clientX: number) => {
    const r = screenRef.current?.getBoundingClientRect()
    if (!r || !r.width) return st.current.sweep
    const pad = travelPad(r.width)
    return (clientX - r.left - pad) / (r.width - 2 * pad)
  }
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    const touch = e.pointerType === "touch"
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: !touch, touch }
    if (!touch) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      inputRef.current?.focus({ preventScroll: true })
      engage(xToSweep(e.clientX))
    }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.active) {
      // touch: only a deliberate horizontal drag takes the scanline; vertical is always scroll
      const dx = Math.abs(e.clientX - d.x0)
      const dy = Math.abs(e.clientY - d.y0)
      if (dy > 10 && dy > dx) {
        drag.current = null
        return
      }
      if (dx < 8 || dx < dy) return
      d.active = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
    }
    engage(xToSweep(e.clientX))
  }
  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  const px = size != null
  const svgBox = (tiles: 1 | 2) =>
    px
      ? {
          viewBox: `0 0 ${geo.w * tiles} ${geo.h}`,
          preserveAspectRatio: "none",
          width: geo.w * tiles,
          height: geo.h,
        }
      : { viewBox: `0 0 ${SCOPE_SSR.w} ${SCOPE_SSR.h}`, preserveAspectRatio: "xMidYMid slice", width: "100%", height: "100%" }
  // SSR/pre-measure: sweep .5 expressed in percentages (no measurement needed)
  const ssr = (t: string): CSSProperties | undefined => (px ? undefined : { transform: t })
  // the drift carrier: an HTML box exactly as wide as the 2W feed (the SVG's transform is the sweep's)
  const driftBox: CSSProperties | undefined = px ? { width: geo.w * 2, height: geo.h } : undefined

  return (
    <figure className={className}>
      <div
        ref={panelRef}
        data-reveal="custom"
        className={cn(
          s.scopePanel,
          "vf-host relative aspect-[4/5] w-full rounded-[14px] border border-line bg-ink-900 md:aspect-[16/9] lg:aspect-[16/7]",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <ViewfinderFrame always />
        <div
          ref={screenRef}
          // the drift is a CSS loop: MotionBoot pauses [data-loop] subtrees offscreen
          data-loop=""
          data-px={px ? "" : undefined}
          style={px ? ({ "--drift-dur": `${(geo.w / DRIFT_PX_S).toFixed(3)}s` } as CSSProperties) : undefined}
          className={cn(s.scopeScreen, "absolute inset-0 overflow-clip rounded-[13px]")}
        >
          {/* static graticule */}
          <svg aria-hidden="true" className={s.scopeLayer} {...svgBox(1)}>
            <path d={geo.grid.verticals} className={s.gridV} />
            <path d={geo.grid.dividers} className={s.gridDiv} />
            <path d={geo.grid.ticks} className={s.gridTick} />
          </svg>

          {/* the illustration (one accessible image; layers below are its parts) */}
          <div role="img" aria-label={ARIA_IMG} className="absolute inset-0">
            {/* TUNED: window [0, sweep) */}
            <div ref={tuOuter} className={s.scopeWindow} style={ssr("translateX(-50%)")}>
              <div className={s.scopeDrift} style={driftBox}>
                <svg ref={tuInner} aria-hidden="true" className={s.scopeLayer} style={ssr("translateX(50%)")} {...svgBox(px ? 2 : 1)}>
                  <path d={geo.tuned.fill} className={s.tFill} />
                  <path d={geo.tuned.provisioned} className={s.tProv} />
                  <path d={geo.tuned.base} className={s.tBase} />
                  <path d={geo.tuned.alerts} className={s.tAlert} />
                  <path d={geo.tuned.alertHeads} className={s.tAlertHead} />
                  <path d={geo.tuned.goTicks} className={s.tGo} />
                  <path d={geo.tuned.link} className={s.tLink} />
                  <path d={geo.tuned.dots} className={s.tDots} />
                </svg>
              </div>
            </div>

            {/* UNTUNED: window [sweep, 1] */}
            <div ref={unOuter} className={s.scopeWindow} style={ssr("translateX(50%)")}>
              <div className={s.scopeDrift} style={driftBox}>
                <svg ref={unInner} aria-hidden="true" className={s.scopeLayer} style={ssr("translateX(-50%)")} {...svgBox(px ? 2 : 1)}>
                  <defs>
                    <pattern id={hatchId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="7" className={s.uHatchLine} />
                    </pattern>
                  </defs>
                  <path d={geo.untuned.hatch} fill={`url(#${hatchId})`} className={s.uHatch} />
                  <path d={geo.untuned.provisioned} className={s.uProv} />
                  <path d={geo.untuned.noiseBase} className={s.uBase} />
                  <path d={geo.untuned.spikes} className={s.uSpike} />
                  <path d={geo.untuned.spikesAlarm} className={s.uSpikeAlarm} />
                  <path d={geo.untuned.bars} className={s.uBar} />
                  <path d={geo.untuned.barsAlarm} className={s.uBarAlarm} />
                  <path d={geo.untuned.barsX} className={s.uX} />
                  <path d={geo.untuned.dots} className={s.uDots} />
                </svg>
              </div>
            </div>

            {/* shared: real usage runs straight through the scanline */}
            <div className={s.scopeWindowStatic}>
              <div className={s.scopeDrift} style={driftBox}>
                <svg aria-hidden="true" className={s.scopeLayer} {...svgBox(px ? 2 : 1)}>
                  <path d={geo.common.usage} className={s.cUsage} />
                </svg>
              </div>
            </div>
          </div>

          {/* lane labels */}
          {SCOPE_LANES.map((l, i) => (
            <span
              key={l.key}
              aria-hidden="true"
              className={cn(s.laneLabel, "font-mono text-hud uppercase")}
              style={{ top: `calc(${i * 25}% + 7px)` }}
            >
              {l.label}
            </span>
          ))}
          <span aria-hidden="true" className={cn(s.corner, s.cornerTl)} />
          <span aria-hidden="true" className={cn(s.corner, s.cornerTr)} />
          <span aria-hidden="true" className={cn(s.corner, s.cornerBl)} />
          <span aria-hidden="true" className={cn(s.corner, s.cornerBr)} />

          {/* keyboard / AT control; pointer input is handled on the panel */}
          <input
            ref={inputRef}
            type="range"
            min={0}
            max={100}
            step={1}
            defaultValue={50}
            aria-label="Compare untuned and tuned illustrative signals"
            aria-valuetext={valueText(50)}
            // no JS = nothing to drive: keep a dead slider out of the page and the a11y tree
            className={cn(s.scopeRange, "js-only")}
            onChange={(e) => engage(Number(e.currentTarget.value) / 100)}
          />

          {/* the scanline */}
          <div ref={scanRef} aria-hidden="true" className={s.scan} style={ssr("translateX(50%)")}>
            <span className={s.scanBeam} />
            <span className={s.scanBar} />
            <span className={s.scanHandle}>
              <span className={cn(s.hvf, s.hvfTl)} />
              <span className={cn(s.hvf, s.hvfTr)} />
              <span className={cn(s.hvf, s.hvfBl)} />
              <span className={cn(s.hvf, s.hvfBr)} />
            </span>
            <span className={s.chips}>
              <span className={cn(s.chip, s.chipL, "font-mono text-hud uppercase")}>Tuned ←</span>
              <span className={cn(s.chip, s.chipR, "font-mono text-hud uppercase")}>→ Untuned</span>
            </span>
          </div>
        </div>
        {/* power-on: the notice's rule, arriving on the dark glass */}
        <Hairline draw="none" className={s.powerLine} />
      </div>
      <figcaption className="mt-3 text-right font-mono text-hud uppercase text-paper-dim">
        Illustrative signals, not client data.
      </figcaption>
    </figure>
  )
}
