"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import type { MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { fitCanvas, onContextLoss } from "@/lib/gl/mini-gl"
import { clamp, ease, lerp, smoothstep } from "@/lib/motion/math"
import { heroT0Ms, introClockOrigin } from "@/lib/motion/pref"
import { DUR_MS, HERO, SPRING } from "@/lib/motion/tokens"
import { useRafWhenVisible } from "@/hooks/use-raf-when-visible"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import type { FieldFrame, SignalFieldEngine } from "./signal-field-gl"
import { SignalPoster } from "./signal-poster"

export type SignalFieldProps = {
  preset: "hero" | "horizon"
  /** hero: scroll-out 0..1 ; horizon: entry 0..1 */
  progress?: MotionValue<number>
  /** text rect to attenuate lines behind */
  avoidRef?: RefObject<HTMLElement | null>
  /** hero only: element carrying the blade-sweep CSS animation */
  bladeRef?: RefObject<HTMLElement | null>
  /** element whose vertical centre is the streak row */
  horizonRef?: RefObject<HTMLElement | null>
  className?: string
}

type Geo = {
  w: number
  h: number
  dpr: number
  cssW: number
  cssH: number
  left: number
  /** canvas top in page coordinates (css px) */
  pageTop: number
  horizon: number
  flareY: number
  avoid: [number, number, number, number]
  /** blade line (.l1) left / width as fractions of the canvas width */
  l1Left: number
  l1W: number
  mobile: boolean
}

type BladeState = { anim: CSSAnimation | null; doneAt: number | null; tipEnd: number; misses: number }

const CUT_DONE = 1.05
const RUNOUT_MS = DUR_MS.f4

const isBladeAnim = (a: Animation): a is CSSAnimation =>
  typeof (a as CSSAnimation).animationName === "string" && (a as CSSAnimation).animationName.includes("blade-sweep")

/**
 * The Throughline's light field. SSR renders the poster; a WebGL canvas (engine lazy-imported the
 * first time the instance comes within 200px of the viewport) fades in over it after its first
 * drawn frame. One rAF source (useRafWhenVisible): the loop runs only while this instance is on
 * screen, the tab is visible and motion is full. Reduced motion draws exactly one frame.
 * No WebGL / context loss → the poster stays (or comes back).
 */
export function SignalField({ preset, progress, avoidRef, bladeRef, horizonRef, className }: SignalFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SignalFieldEngine | null>(null)
  const [live, setLive] = useState(false)
  const reduced = useReducedMotionSafe()
  const reducedRef = useRef(reduced)
  const geo = useRef<Geo>({
    w: 1,
    h: 1,
    dpr: 1,
    cssW: 1,
    cssH: 1,
    left: 0,
    pageTop: 0,
    horizon: 0,
    flareY: 0,
    avoid: [0, 0, 0, 0],
    l1Left: 0,
    l1W: 0,
    mobile: false,
  })
  const ptr = useRef({ cx: 0, cy: 0, has: false, fine: false, x: 0.5, vx: 0, y: 0, vy: 0, s: 0, vs: 0, seeded: false })
  const blade = useRef<BladeState>({ anim: null, doneAt: null, tipEnd: 1, misses: 0 })
  const igniteAt = useRef(0)
  const drawn = useRef(false)
  const lastFade = useRef(-1)
  const lastT = useRef(0)

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  /* ---------------------------------------------------------------- measurement (resize / scroll end) */
  const measure = () => {
    const canvas = canvasRef.current
    const root = rootRef.current
    const eng = engineRef.current
    if (!canvas || !root) return
    const { w, h, dpr } = fitCanvas(canvas, 2)
    const cr = canvas.getBoundingClientRect()
    const g = geo.current
    g.w = w
    g.h = h
    g.dpr = dpr
    g.cssW = Math.max(1, cr.width)
    g.cssH = Math.max(1, cr.height)
    g.left = cr.left
    g.pageTop = cr.top + window.scrollY
    g.mobile = cr.width < 768
    const hr = horizonRef?.current?.getBoundingClientRect()
    g.horizon = hr ? (hr.top + hr.height / 2 - cr.top) * dpr : (preset === "hero" ? 0.5 : 0.78) * h
    g.flareY = preset === "hero" || hr ? g.horizon : 0.78 * h
    const ar = avoidRef?.current?.getBoundingClientRect()
    g.avoid = ar && ar.width > 0 ? [(ar.left - cr.left) * dpr, (ar.top - cr.top) * dpr, ar.width * dpr, ar.height * dpr] : [0, 0, 0, 0]
    const br = bladeRef?.current?.getBoundingClientRect()
    if (br && br.width > 0) {
      g.l1Left = (br.left - cr.left) / g.cssW
      g.l1W = br.width / g.cssW
    }
    if (preset === "hero") root.style.setProperty("--hy", `${((g.horizon / h) * 100).toFixed(3)}%`)
    const lines = preset === "horizon" ? 18 : g.cssW >= 1024 ? 48 : g.cssW >= 768 ? 32 : 20
    const segs = g.mobile ? 96 : 160
    eng?.resize(w, h, dpr, lines, segs)
  }

  /* ---------------------------------------------------------------- per-frame state (pure reads) */
  const bladeCut = (t: number): number => {
    const g = geo.current
    const b = blade.current
    const el = bladeRef?.current
    if (!el || reducedRef.current) return CUT_DONE
    if (b.doneAt !== null) {
      if (g.mobile) return CUT_DONE
      return lerp(b.tipEnd, CUT_DONE, ease.title(clamp((t - b.doneAt) / RUNOUT_MS)))
    }
    let a = b.anim
    if (!a || a.playState === "idle") {
      a = el.getAnimations().find(isBladeAnim) ?? null
      b.anim = a
    }
    if (!a || !a.effect) {
      // No blade animation (reduced / still / unsupported): calm field.
      b.misses++
      return b.misses > 2 ? CUT_DONE : 0
    }
    const timing = a.effect.getComputedTiming()
    const delay = Number(a.effect.getTiming().delay ?? 0)
    const dur = Number(timing.duration ?? HERO.bladeSweep)
    const ct = Number(a.currentTime ?? 0)
    const tip = (e: number) => g.l1Left + e * g.l1W
    if (a.playState === "finished" || ct >= delay + dur) {
      b.tipEnd = tip(1)
      // already over before the first GL frame (late mount): no runout
      b.doneAt = lastT.current === 0 ? -1e9 : t
      return bladeCut(t)
    }
    if (ct < delay) return -0.05
    if (g.mobile) return -0.05
    return tip(ease.cut(clamp(timing.progress ?? 0)))
  }

  const stepPointer = (dt: number) => {
    const g = geo.current
    const p = ptr.current
    let tx = 0.5
    let ty = g.horizon
    let ts = 0
    if (p.fine && p.has && !g.mobile) {
      const top = g.pageTop - window.scrollY
      const lx = (p.cx - g.left) / g.cssW
      const ly = p.cy - top
      if (lx >= 0 && lx <= 1 && ly >= 0 && ly <= g.cssH) {
        tx = lx
        ty = ly * g.dpr
        ts = 1
      }
    }
    if (!p.seeded) {
      p.x = tx
      p.y = ty
      p.seeded = true
    }
    // SPRING.follow, semi-implicit Euler (x in canvas-fraction, y in px, s = lens strength)
    const { stiffness: k, damping: c, mass: m } = SPRING.follow
    p.vx += ((k * (tx - p.x) - c * p.vx) / m) * dt
    p.x += p.vx * dt
    p.vy += ((k * (ty - p.y) - c * p.vy) / m) * dt
    p.y += p.vy * dt
    p.vs += ((k * (ts - p.s) - c * p.vs) / m) * dt
    p.s = clamp(p.s + p.vs * dt, 0, 1)
  }

  const buildFrame = (t: number, still: boolean): FieldFrame => {
    const g = geo.current
    const p = ptr.current
    const quality = still ? 1 : rafQuality.current
    const lensX = p.x * g.w
    if (preset === "hero") {
      const hp = still ? 0 : clamp(progress?.get() ?? 0)
      const ignite = still ? 1 : ease.title(clamp((t - igniteAt.current) / DUR_MS.f12))
      return {
        time: still ? 12 : t / 1000,
        cut: still ? CUT_DONE : bladeCut(t),
        converge: smoothstep(0.1, 0.8, hp),
        collapse: smoothstep(0.35, 0.9, hp),
        k: lerp(180, 1400, hp),
        intensity: ignite * (1 - smoothstep(0.6, 0.95, hp)),
        gain: 1,
        horizon: g.horizon,
        flareX: lerp(0.5, p.x, 0.35) * g.w,
        flareY: g.flareY,
        px: lensX,
        py: p.y,
        lens: still ? 0 : p.s,
        avoid: g.avoid,
        quality,
      }
    }
    const ep = still ? 1 : clamp(progress?.get() ?? 1)
    // Spec: 1 − smoothstep(0, .4, p). Widened so the unfold plays while the lines' rows (0.45H…H)
    // are actually on screen; with (0, .4) it completes below the fold and is never seen.
    const collapse = 1 - smoothstep(0.15, 0.85, ep)
    return {
      time: still ? 12 : t / 1000,
      cut: CUT_DONE,
      converge: 0,
      collapse,
      k: 180,
      intensity: smoothstep(0.08, 0.5, ep),
      gain: 1,
      horizon: g.horizon,
      flareX: lerp(0.5, p.x, 0.35) * g.w,
      flareY: g.flareY,
      px: lensX,
      py: p.y,
      lens: still ? 0 : p.s,
      avoid: g.avoid,
      quality,
    }
  }

  const markDrawn = () => {
    if (drawn.current) return
    drawn.current = true
    rootRef.current?.setAttribute("data-drawn", "")
  }

  const setFade = (v: number) => {
    const r = Math.round(v * 1000) / 1000
    if (r === lastFade.current || !fadeRef.current) return
    lastFade.current = r
    fadeRef.current.style.opacity = String(r)
  }

  const tick = (t: number, dt: number) => {
    const eng = engineRef.current
    if (!eng) return
    stepPointer(dt)
    const f = buildFrame(t, false)
    if (preset === "hero") setFade(1 - smoothstep(0.88, 0.98, clamp(progress?.get() ?? 0)))
    if (!eng.draw(f)) return
    lastT.current = t
    markDrawn()
  }

  const drawStill = () => {
    const eng = engineRef.current
    if (!eng) return
    ptr.current.s = 0
    setFade(1)
    if (eng.draw(buildFrame(0, true))) markDrawn()
  }

  const { quality: rafQuality } = useRafWhenVisible(rootRef, tick, { fps: 60, adaptive: true, enabled: live })

  /* ---------------------------------------------------------------- lazy GL init (first approach) */
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    let disposed = false
    let unLoss: (() => void) | undefined
    igniteAt.current = introClockOrigin() + heroT0Ms()

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        import("./signal-field-gl")
          .then(({ createSignalFieldGL }) => {
            if (disposed) return
            const eng = createSignalFieldGL(canvas, preset)
            if (!eng) return // no WebGL: the poster is the design
            engineRef.current = eng
            unLoss = onContextLoss(
              canvas,
              () => {
                eng.lost()
                drawn.current = false
                root.removeAttribute("data-drawn")
                setLive(false)
              },
              () => {
                if (!eng.restore()) return
                measure()
                setLive(true)
              },
            )
            measure()
            setLive(true)
          })
          .catch(() => {
            /* chunk failed to load: keep the poster */
          })
      },
      { rootMargin: "200px" },
    )
    io.observe(root)
    return () => {
      disposed = true
      io.disconnect()
      unLoss?.()
      engineRef.current?.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  /* ---------------------------------------------------------------- keep geometry current */
  useEffect(() => {
    if (!live) return
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        measure()
        if (reducedRef.current) drawStill()
      })
    }
    const ro = new ResizeObserver(schedule)
    const els = [rootRef.current, avoidRef?.current, bladeRef?.current, horizonRef?.current]
    els.forEach((el) => el && ro.observe(el))
    let scrollTimer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(schedule, 160)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    document.fonts?.ready.then(schedule).catch(() => {})
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(scrollTimer)
      window.removeEventListener("scroll", onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  /* ---------------------------------------------------------------- reduced motion: one frame, then stop */
  useEffect(() => {
    if (live && reduced) drawStill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, reduced])

  /* ---------------------------------------------------------------- pointer (fine pointers only; no touch) */
  useEffect(() => {
    if (!live) return
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const p = ptr.current
    p.fine = mq.matches
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return
      p.cx = e.clientX
      p.cy = e.clientY
      p.has = true
    }
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) p.has = false
    }
    const onMq = () => (p.fine = mq.matches)
    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerout", onOut, { passive: true })
    mq.addEventListener("change", onMq)
    return () => {
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerout", onOut)
      mq.removeEventListener("change", onMq)
    }
  }, [live])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-signal-field={preset}
      className={cn("group pointer-events-none absolute inset-0", className)}
    >
      <div className="absolute inset-0 transition-opacity duration-f12 ease-title group-data-[drawn]:opacity-0">
        <SignalPoster preset={preset} />
      </div>
      <div ref={fadeRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-f12 ease-title group-data-[drawn]:opacity-100 forced:hidden"
        />
      </div>
    </div>
  )
}
