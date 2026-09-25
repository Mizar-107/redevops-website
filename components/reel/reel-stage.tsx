"use client"

import { Fragment, memo, useCallback, useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react"
import { cancelFrame, frame, motionValue, type MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { ease, lerp, mixHex, morph, seg, type Pt } from "@/lib/motion/math"
import { K0, type SceneModule, type SceneProps } from "@/lib/reel/scene"
import { DUR_MS } from "@/lib/motion/tokens"
import { useScrub } from "@/hooks/use-scrub"
import { useStickyGuard } from "@/hooks/use-sticky-guard"
import { useReducedMotionSafe } from "@/hooks/use-motion-pref"
import { useChrome } from "@/components/motion/motion-provider"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import { ScrambleText } from "@/components/motion/scramble-text"
import { SCENES } from "./scenes"
import { SERVICES } from "./services-data"
import { SIGNAL, SignalLine, TUNGSTEN, type SignalFrame, type SignalLineHandle } from "./signal-line"
import { Letterbox, type LetterboxHandle } from "./letterbox"
import { TransitionPanels, type TransitionHandle } from "./scene-transitions"
import { TagLine } from "./scene-frame"
import styles from "./reel.module.css"

/* ------------------------------------------------------------------ mapping (pure) */

/** Scroll progress p of the pinned wrap → every stage quantity. */
export function mapReel(p: number) {
  const L = seg(p, 0, 0.04) * (1 - seg(p, 0.96, 1)) // letterbox engage / release
  const lb = ease.iris(L)
  const pp = seg(p, 0.04, 0.96)
  const c = Math.min(3, Math.floor(pp * 4))
  const local = pp * 4 - c
  const v = seg(local, 0.06, 0.7) // scene progress
  const w = c < 3 ? seg(local, 0.86, 1) : 0 // transition c → c+1
  return { L, lb, pp, c, local, v, w }
}
type ReelMap = ReturnType<typeof mapReel>

const tint = (r: number) => mixHex(TUNGSTEN, SIGNAL, r)

/**
 * The throughline for stage progress p (pure — scrubbing backwards is exact).
 * engage: K0 drawn from the centre outward with the letterbox · chapter 1 lead-in: K0 → cost(0)
 * · in chapter: keyShape(v) · transition: keyShape_c(1) → keyShape_c+1(0) · release: → K0.
 */
export function reelLine(
  p: number,
  m: ReelMap = mapReel(p),
  scenes: readonly SceneModule[] = SCENES,
): SignalFrame {
  if (p < 0.04) return { pts: K0, smooth: false, color: SIGNAL, reveal: m.lb }
  if (p > 0.96) {
    const a = scenes[3]
    const t = seg(p, 0.96, 0.985)
    return {
      pts: morph(a.keyShape(1), K0, t),
      smooth: a.smooth,
      color: tint(lerp(a.resolve(1), 1, t)),
      head: 1 - seg(p, 0.972, 0.99),
      // the line hands over to the seam (identical row) as the seam finishes drawing
      opacity: 1 - seg(p, 0.99, 1),
    }
  }
  const s = scenes[m.c]
  if (m.w > 0) {
    const b = scenes[m.c + 1]
    return {
      pts: morph(s.keyShape(1), b.keyShape(0), m.w),
      smooth: m.w < 0.5 ? s.smooth : b.smooth,
      color: tint(lerp(s.resolve(1), b.resolve(0), ease.iris(m.w))),
    }
  }
  if (m.local < 0.06) {
    // The transition already delivered keyShape_c(0) for c > 0; only chapter 1 morphs in from K0.
    if (m.c === 0) {
      const t = seg(m.local, 0, 0.06)
      return { pts: morph(K0, s.keyShape(0), t), smooth: s.smooth, color: tint(lerp(1, s.resolve(0), ease.iris(t))) }
    }
    return { pts: s.keyShape(0), smooth: s.smooth, color: tint(s.resolve(0)) }
  }
  return { pts: s.keyShape(m.v), smooth: s.smooth, color: tint(s.resolve(m.v)) }
}

const pad2 = (n: number) => String(n).padStart(2, "0")
const chaptersOf = (scenes: readonly SceneModule[]) =>
  scenes.map((s) => ({ label: s.label, title: s.label.charAt(0) + s.label.slice(1).toLowerCase() }))
const INITIAL_LINE: SignalFrame = { pts: K0 as Pt[], smooth: false, color: SIGNAL, reveal: 0 }

/* ------------------------------------------------------------------ pieces */

/** h3 title split into masked words (global .split/.w/.wi matte); state CSS lives in reel.module.css. */
const MaskTitle = memo(function MaskTitle({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className="split">
      <span className="sr-only select-none">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="w" style={{ "--wd": `${i * DUR_MS.f1}ms` } as CSSProperties}>
              <span className="wi">{w}</span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </span>
  )
})

/** One scene's Furniture; re-renders only when its own `active` flips (not on every chapter change). */
const SceneLayer = memo(function SceneLayer({
  Furniture,
  progress,
  active,
}: {
  Furniture: ComponentType<SceneProps>
  progress: MotionValue<number>
  active: boolean
}) {
  return <Furniture progress={progress} mode="scrub" active={active} />
})

/* ------------------------------------------------------------------ stage */

type StageState = {
  enabled: boolean
  lastP: number
  c: number
  beatChapter: number
  beat: number
  phase: string
  chrome: string
  rule: string
}

/**
 * The pinned widescreen reel (lg+, motion full): a 360svh wrap with a sticky 100svh stage.
 * One progress subscription drives everything imperatively; React renders only when the chapter
 * index changes.
 */
export function ReelStage({ scenes = SCENES }: { scenes?: readonly SceneModule[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const beatEls = useRef<(HTMLSpanElement | null)[][]>(SERVICES.map(() => []))
  const lineRef = useRef<SignalLineHandle>(null)
  const transRef = useRef<TransitionHandle>(null)
  const lbRef = useRef<LetterboxHandle>(null)
  const monitorRef = useRef<HTMLDivElement>(null)
  const seamRef = useRef<HTMLSpanElement>(null)
  const articlesRef = useRef<HTMLDivElement>(null)
  const seamFrom = useRef(0.5)

  useStickyGuard(stageRef)
  const { raw, progress } = useScrub(wrapRef, ["start start", "end end"])
  const { letterbox } = useChrome()
  const reduced = useReducedMotionSafe()
  const [chapter, setChapter] = useState(0)
  const [sceneProgress] = useState(() => scenes.map(() => motionValue(0)))
  const [chapters] = useState(() => chaptersOf(scenes))
  const [beatRefs] = useState(() =>
    SERVICES.map((_, i) => (el: HTMLSpanElement | null, b: number) => {
      beatEls.current[i][b] = el
    }),
  )
  const st = useRef<StageState>({ enabled: false, lastP: -1, c: 0, beatChapter: -1, beat: -1, phase: "pre", chrome: "", rule: "" })

  /** Scene MotionValues are set synchronously in the change handler so each Furniture's own
   *  frame.update lands in the same frame as the stage's DOM writes. */
  const setScenes = useCallback(
    (m: ReelMap) => {
      for (let i = 0; i < sceneProgress.length; i++) {
        const target = i < m.c ? 1 : i > m.c ? 0 : m.v
        if (sceneProgress[i].get() !== target) sceneProgress[i].set(target)
      }
    },
    [sceneProgress],
  )

  const render = useCallback(
    (p: number) => {
      const s = st.current
      const m = mapReel(p)
      s.lastP = p

      // letterbox bars + chapter tracks + the shared chrome value (header merges above .5).
      // The bars follow the smoothed p; the page chrome is gated by raw scroll so a jump past the
      // wrap (End, nav click, deep link) drops the header merge / 2.39:1 chip at once instead of
      // riding the spring's sweep over whatever section is now on screen.
      lbRef.current?.update(m.lb, m.pp * 4)
      const r = raw.get()
      const lb = r <= 0 || r >= 1 ? 0 : m.lb
      if (Math.abs(letterbox.get() - lb) > 1e-4 || (lb === 0 && letterbox.get() !== 0)) letterbox.set(lb)

      // engage phase: the text rises when the bars close. On release the last chapter's copy
      // stays and scrolls away beside the seam (only the monitor fades).
      const phase = p < 0.02 ? "pre" : "live"
      if (phase !== s.phase) {
        s.phase = phase
        stageRef.current?.setAttribute("data-phase", phase)
      }

      // discrete chapter change → the only React render
      if (m.c !== s.c) {
        s.c = m.c
        setChapter(m.c)
      }

      // active beat of the tag line (attribute only when it changes)
      const tags = SERVICES[m.c].tags
      const beat = Math.min(scenes[m.c].beatAt(m.v), tags.length - 1)
      if (m.c !== s.beatChapter || beat !== s.beat) {
        if (s.beatChapter >= 0) beatEls.current[s.beatChapter][s.beat]?.removeAttribute("data-on")
        beatEls.current[m.c][beat]?.setAttribute("data-on", "")
        s.beatChapter = m.c
        s.beat = beat
      }

      // scene layers + editorial transition panels
      transRef.current?.apply(m.c, m.w, layerRefs.current)

      // the throughline
      lineRef.current?.draw(reelLine(p, m, scenes))

      // release: the monitor fades while the letterbox opens; the line stays
      const o = (1 - ease.cut(seg(p, 0.972, 1))).toFixed(3)
      if (o !== s.chrome) {
        s.chrome = o
        if (chromeRef.current) chromeRef.current.style.opacity = o
      }

      // ...and the line leaves the monitor as a full-bleed seam (the hand-off to Results)
      const t = ease.cut(seg(p, 0.975, 1))
      const rule = t > 0 ? lerp(seamFrom.current, 1, t).toFixed(4) : "0"
      if (rule !== s.rule) {
        s.rule = rule
        const el = seamRef.current
        if (el) {
          el.style.transform = `scaleX(${rule})`
          el.style.opacity = t > 0 ? "1" : "0"
        }
      }
    },
    [letterbox, raw, scenes],
  )

  // Only drive anything while the pinned layout is actually displayed (lg + motion full).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => {
      const on = mq.matches && !reduced
      st.current.enabled = on
      if (on) {
        const p = progress.get()
        setScenes(mapReel(p))
        render(p)
      } else {
        letterbox.set(0)
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => {
      mq.removeEventListener("change", sync)
      letterbox.set(0)
    }
  }, [reduced, progress, render, setScenes, letterbox])

  useEffect(() => {
    let queued = false
    const run = () => {
      queued = false
      if (st.current.enabled) render(progress.get())
    }
    const off = progress.on("change", (p) => {
      const s = st.current
      if (!s.enabled || Math.abs(p - s.lastP) < 0.0002) return
      setScenes(mapReel(p))
      if (queued) return
      queued = true
      frame.update(run)
    })
    // raw hitting an end (wrap fully past) gates the page chrome off even before the spring moves
    const offRaw = raw.on("change", (r) => {
      if (!st.current.enabled || (r > 0 && r < 1) || letterbox.get() === 0 || queued) return
      queued = true
      frame.update(run)
    })
    return () => {
      off()
      offRaw()
      cancelFrame(run)
    }
  }, [progress, raw, letterbox, render, setScenes])

  // The seam continues the monitor's K0 row out to the right edge and back to the copy's gutter
  // (the last chapter's copy stays on screen through the release, so the rule never strikes it).
  useEffect(() => {
    const stage = stageRef.current
    const mon = monitorRef.current
    const arts = articlesRef.current
    if (!stage || !mon) return
    const measure = () => {
      const s = stage.getBoundingClientRect()
      const m = mon.getBoundingClientRect()
      if (!m.width) return
      const a = arts?.getBoundingClientRect()
      // half the grid gap (gap-8) past the copy column
      const left = a && a.width ? Math.max(0, Math.min(m.left - s.left, a.right - s.left + 16)) : 0
      stage.style.setProperty("--seam-l", `${left.toFixed(1)}px`)
      stage.style.setProperty("--mon-cx", `${(m.left - s.left + m.width / 2).toFixed(1)}px`)
      stage.style.setProperty("--mon-y", `${(m.top - s.top + m.height / 2).toFixed(1)}px`)
      const span = s.width - left
      seamFrom.current = span > 0 ? Math.min(1, m.width / span) : 0.5
      st.current.rule = "" // re-apply with the new start width
      if (st.current.enabled) render(st.current.lastP)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(mon)
    if (arts) ro.observe(arts)
    return () => ro.disconnect()
  }, [render])

  const chapterTop = useCallback((i: number) => {
    const wrap = wrapRef.current
    if (!wrap) return null
    const top = wrap.getBoundingClientRect().top + window.scrollY
    const span = wrap.offsetHeight - window.innerHeight
    return top + (0.04 + (i + 0.35) * 0.23) * span
  }, [])

  const onJump = useCallback(
    (i: number) => {
      const top = chapterTop(i)
      if (top != null) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
    },
    [chapterTop, reduced],
  )

  // Keyboard focus on a chapter button while the bars are open (not pinned): engage the reel so
  // the focused button is actually on screen.
  const onChapterFocus = useCallback(
    (i: number) => {
      const p = progress.get()
      if (p >= 0.04 && p <= 0.96) return
      const top = chapterTop(i)
      if (top != null) window.scrollTo({ top, behavior: "instant" as ScrollBehavior })
    },
    [chapterTop, progress],
  )

  const scene = scenes[chapter]

  return (
    <div ref={wrapRef} className="reel-wrap relative hidden lg:fx:block lg:fx:h-[360svh]">
      <div
        ref={stageRef}
        data-phase="pre"
        className={cn("reel-stage top-0 h-[100svh] overflow-clip lg:fx:sticky", styles.stage)}
      >
        <div className="vignette pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className={styles.frame}>
          <div className="shell grid w-full grid-cols-12 items-center gap-8">
            {/* four articles stacked in one cell; all stay in the accessibility tree */}
            <div ref={articlesRef} className={cn("col-span-5", styles.articles)}>
              {SERVICES.map((s, i) => (
                <article
                  key={s.id}
                  className={styles.article}
                  data-state={i === chapter ? "active" : i < chapter ? "after" : "before"}
                >
                  <p className={cn(styles.numeral, "text-numeral")} aria-hidden="true">
                    <span className={styles.numIn}>{pad2(i + 1)}</span>
                  </p>
                  <h3 className={`${styles.title} mt-4 text-h3 text-paper`}>
                    <MaskTitle text={s.title} />
                  </h3>
                  <p className={`${styles.desc} mt-5 max-w-[44ch] text-body text-paper-dim`}>{s.description}</p>
                  {/* each chapter carries its own scene description (the shared monitor is decorative) */}
                  <p className="sr-only select-none">{scenes[i].ariaLabel}</p>
                  <TagLine
                    className="mt-6 max-w-[48ch]"
                    tags={s.tags}
                    track
                    beatRef={beatRefs[i]}
                  />
                </article>
              ))}
            </div>

            {/* the monitor */}
            <div className="col-span-7">
              <div ref={monitorRef} className={styles.monitor} aria-hidden="true">
                <div ref={chromeRef} className={cn("vf-host", styles.chrome)}>
                  <ViewfinderFrame always />
                  <div className={styles.screen}>
                    {scenes.map((sc, i) => (
                      <div
                        key={sc.id}
                        ref={(el) => {
                          layerRefs.current[i] = el
                        }}
                        className={cn("scene-layer", styles.layer)}
                      >
                        <SceneLayer Furniture={sc.Furniture} progress={sceneProgress[i]} active={chapter === i} />
                      </div>
                    ))}
                    <TransitionPanels ref={transRef} />
                  </div>
                  <span className={cn(styles.monLabel, "font-mono text-hud uppercase")} aria-hidden="true">
                    <span>MON ·</span>
                    <b>
                      <ScrambleText text={scene.label} trigger="change" />
                    </b>
                  </span>
                  <span className={cn(styles.rowTick, styles.rowTickL)} aria-hidden="true" />
                  <span className={cn(styles.rowTick, styles.rowTickR)} aria-hidden="true" />
                </div>
                <SignalLine ref={lineRef} initial={INITIAL_LINE} className={styles.line} />
              </div>
            </div>
          </div>
        </div>

        {/* release: the K0 row continues from the copy's gutter to the right edge of the frame */}
        <span ref={seamRef} aria-hidden="true" className={cn("hairline", styles.seam)} />

        <Letterbox
          ref={lbRef}
          chapter={chapter}
          chapters={chapters}
          onJump={onJump}
          onChapterFocus={onChapterFocus}
        />
      </div>
    </div>
  )
}
