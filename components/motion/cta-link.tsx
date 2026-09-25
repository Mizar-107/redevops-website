"use client"

import Link from "next/link"
import type { AnchorHTMLAttributes, CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { Magnetic } from "./magnetic"
import { ViewfinderFrame } from "./viewfinder-frame"

export type CtaLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href: string
  variant: "primary" | "secondary" | "ghost"
  /** heights: sm 36, md 44, lg 52, xl 60px */
  size?: "sm" | "md" | "lg" | "xl"
  /** opens in a new tab with rel="noopener noreferrer" */
  external?: boolean
  /** inner label pulls toward the pointer (≤ 8px, fine pointers only) */
  magnetic?: boolean
  icon?: "arrow" | "mail" | "none"
  iconPosition?: "start" | "end"
  /** secondary: stroke the border on reveal */
  drawBorder?: boolean
  /** when the border draw happens (default view) */
  trigger?: "view" | "intro"
  /** ms, for the border draw */
  delay?: number
  /** render the throughline underline slot ([data-cta-underline]) under the button */
  underline?: boolean
  /** light the underline + glow */
  lit?: boolean
  children: ReactNode
}

function setEntryPoint(e: ReactPointerEvent<HTMLAnchorElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty("--ex", `${Math.round(e.clientX - r.left)}px`)
  el.style.setProperty("--ey", `${Math.round(e.clientY - r.top)}px`)
}

/**
 * The site's one button/link primitive. Hit area never moves; only the inner label may (magnetic).
 * Primary: signal fill; hover = hot fill wiping in from the pointer entry point + one shine sweep +
 * arrow loop. Secondary: 1px border (optionally drawn on reveal). Ghost: text with a drawn underline.
 */
export function CtaLink({
  href,
  variant,
  size = "md",
  external,
  magnetic,
  icon = "none",
  iconPosition,
  drawBorder,
  trigger = "view",
  delay,
  underline,
  lit,
  children,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: CtaLinkProps) {
  const pos = iconPosition ?? (icon === "mail" ? "start" : "end")
  const iconEl =
    icon === "arrow" ? (
      <span className="cta-icon cta-icon-loop" aria-hidden="true">
        <ArrowRight />
        <ArrowRight />
      </span>
    ) : icon === "mail" ? (
      <span className="cta-icon" aria-hidden="true">
        <Mail />
      </span>
    ) : null

  const label = (
    <>
      {pos === "start" && iconEl}
      <span className="cta-text">{children}</span>
      {pos === "end" && iconEl}
    </>
  )

  const borderReveal =
    variant === "secondary" && drawBorder
      ? trigger === "intro"
        ? { "data-reveal-intro": "custom" }
        : { "data-reveal": "custom" }
      : {}

  const vars: Record<string, string> = {}
  if (delay != null) vars["--d"] = `${delay}ms`

  const content = (
    <>
      {variant === "primary" && (
        <>
          <span className="cta-glow" aria-hidden="true" />
          <span className="cta-surface" aria-hidden="true">
            <span className="cta-fill" />
            <span className="cta-shine" />
          </span>
        </>
      )}
      {variant === "secondary" && drawBorder && (
        <svg className="cta-border" aria-hidden="true">
          <rect x="0.5" y="0.5" width="100%" height="100%" rx="10" ry="10" pathLength={1} />
        </svg>
      )}
      {magnetic ? <Magnetic className="cta-label">{label}</Magnetic> : <span className="cta-label">{label}</span>}
      {underline && <span className="cta-underline hairline" data-cta-underline="" aria-hidden="true" />}
      <ViewfinderFrame />
    </>
  )

  const common = {
    className: cn(
      "cta vf-host",
      `cta-${variant}`,
      `cta-${size}`,
      drawBorder && variant === "secondary" && "cta-drawn",
      lit && "is-lit",
      className,
    ),
    style: { ...vars, ...style } as CSSProperties,
    "data-magnet-host": "",
    onPointerEnter: (e: ReactPointerEvent<HTMLAnchorElement>) => {
      setEntryPoint(e)
      onPointerEnter?.(e)
    },
    onPointerLeave: (e: ReactPointerEvent<HTMLAnchorElement>) => {
      setEntryPoint(e)
      onPointerLeave?.(e)
    },
    ...borderReveal,
    ...rest,
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...common}>
        {content}
      </a>
    )
  }
  if (href.startsWith("mailto:") || href.startsWith("#") || /^https?:/.test(href)) {
    return (
      <a href={href} {...common}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} {...common}>
      {content}
    </Link>
  )
}
