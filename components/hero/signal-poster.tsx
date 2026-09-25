import { mulberry32 } from "@/lib/motion/math"

/**
 * SSR poster frame for the SignalField: the designed still for no WebGL, no JS, reduced motion,
 * context loss, and the moment before the canvas fades in. Server-safe, deterministic.
 *
 * hero:    calm seeded lines spread around the horizon (--hy, else the CSS estimate --hy0), a hairline on it, a glow.
 * horizon: 18 calm lines across the lower 55%, the hairline at 78% (the finale's streak row).
 */
const VB = 1000

function heroLines() {
  const r = mulberry32(7)
  const n = 24
  const out: { d: string; o: number }[] = []
  for (let i = 0; i < n; i++) {
    const line = i / (n - 1)
    const y0 = 500 + (line - 0.5) * 840
    const amp = 2 + r() * 5
    const ph = r() * Math.PI * 2
    const fq = 1 + r() * 1.5
    let d = ""
    for (let s = 0; s <= 40; s++) {
      const x = (s / 40) * VB
      const env = Math.sin((s / 40) * Math.PI)
      const y = y0 + amp * env * Math.sin((s / 40) * Math.PI * 2 * fq + ph)
      d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    const depth = Math.abs(line - 0.5) * 2
    out.push({ d, o: 1 - 0.55 * depth * depth })
  }
  return out
}

function horizonLines() {
  const n = 18
  const out: { d: string; o: number }[] = []
  for (let i = 0; i < n; i++) {
    const line = i / (n - 1)
    const y0 = VB * (0.45 + 0.55 * line)
    let d = ""
    for (let s = 0; s <= 40; s++) {
      const x = (s / 40) * VB
      const y = y0 + 3 * Math.sin((s / 40) * 6.283 + line * 3)
      d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    out.push({ d, o: 1 })
  }
  return out
}

const HERO_LINES = heroLines()
const HORIZON_LINES = horizonLines()

export function SignalPoster({ preset }: { preset: "hero" | "horizon" }) {
  const hero = preset === "hero"
  const lines = hero ? HERO_LINES : HORIZON_LINES
  // Where the plate is drawn in layout (SSR) vs the row it follows. The row is --hy (measured by the
  // field once GL is up); before that the hero uses --hy0, a CSS estimate of its horizon row
  // (hero.module.css), so no-JS / no-WebGL / pre-GL frames already sit on the right row.
  const base = hero ? "50%" : "78%"
  const row = hero ? "var(--hy, var(--hy0, 50%))" : "var(--hy, 78%)"
  // Follow the row with a transform, never `top`: --hy is written after hydration, and a transform
  // change is not a layout shift (CLS 0). translateY % = own height = the field height, so this is
  // the same displacement `top` would give.
  const toRow = { transform: `translateY(calc(${row} - ${base}))` }
  return (
    <div aria-hidden="true" className="absolute inset-0" data-signal-poster="">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 40% at 50% ${row}, rgba(34,211,238,.10), transparent 70%)`,
        }}
      />
      {/* hero lines are centred on the horizon row, so the whole plate rides it */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={hero ? toRow : undefined}
        viewBox={`0 0 ${VB} ${VB}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <g stroke="#22D3EE" strokeWidth={1} opacity={hero ? 0.12 : 0.14}>
          {lines.map((l, i) => (
            <path key={i} d={l.d} vectorEffect="non-scaling-stroke" strokeOpacity={l.o} />
          ))}
        </g>
      </svg>
      {/* the anamorphic streak, as a still: a soft band plus the throughline itself */}
      <div className="absolute inset-0" style={toRow}>
        <span
          className="absolute inset-x-0 h-24 -translate-y-1/2 forced:hidden"
          style={{
            top: base,
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(124,244,255,.10), rgba(139,92,246,.05) 45%, transparent 75%)",
          }}
        />
        <span className="hairline hairline-x absolute inset-x-0" style={{ top: base }} />
      </div>
    </div>
  )
}
