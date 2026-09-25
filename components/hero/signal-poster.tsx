/** STUB (owned by W3): SSR poster frame under the WebGL signal field. */
export function SignalPoster({ preset }: { preset: "hero" | "horizon" }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 40% at 50% ${preset === "hero" ? "50%" : "78%"}, rgba(34,211,238,.10), transparent 70%)`,
        }}
      />
      <span className="hairline hairline-x absolute inset-x-0" style={{ top: preset === "hero" ? "50%" : "78%" }} />
    </div>
  )
}
