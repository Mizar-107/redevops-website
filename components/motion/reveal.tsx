import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react"

export type RevealMode = "rise" | "fade" | "mask" | "wipe" | "draw" | "custom"

export type RevealProps = {
  as?: ElementType
  mode?: RevealMode
  /** view: reveal when scrolled into view (after hydration). intro: CSS-timed from --hero-t0, no hydration wait. */
  trigger?: "view" | "intro"
  /** ms */
  delay?: number
  /** position in a staggered group */
  index?: number
  /** ms per index step (default 83 = f2) */
  stagger?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
  id?: string
} & Omit<HTMLAttributes<HTMLElement>, "style" | "className" | "id" | "children">

/**
 * Server-safe reveal wrapper. Emits data-reveal / data-reveal-intro plus --d / --i / --st.
 * Hidden starting states live in CSS (html[data-ready][data-motion=full]); SSR HTML is always the final state.
 */
export function Reveal({
  as: Tag = "div",
  mode = "rise",
  trigger = "view",
  delay,
  index,
  stagger,
  className,
  style,
  children,
  id,
  ...rest
}: RevealProps) {
  const vars: Record<string, string | number> = {}
  if (delay != null) vars["--d"] = `${delay}ms`
  if (index != null) vars["--i"] = index
  if (stagger != null) vars["--st"] = `${stagger}ms`
  const attrs = trigger === "intro" ? { "data-reveal-intro": mode } : { "data-reveal": mode }
  return (
    <Tag id={id} className={className} style={{ ...vars, ...style } as CSSProperties} {...attrs} {...rest}>
      {children}
    </Tag>
  )
}
