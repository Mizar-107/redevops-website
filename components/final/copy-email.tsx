"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { CONTACT_EMAIL } from "@/lib/contact"
import { ViewfinderFrame } from "@/components/motion/viewfinder-frame"
import s from "./final.module.css"

const REVERT_MS = 2200

export type CopyEmailProps = {
  /** id of the element that shows the address (the email CTA); selected as the fallback */
  selectTargetId?: string
  className?: string
}

/** Select the visible address so the viewer can copy it themselves. */
function selectAddress(id: string): boolean {
  const host = document.getElementById(id)
  const el = host?.querySelector<HTMLElement>(".cta-text") ?? host
  const sel = window.getSelection?.()
  if (!el || !sel) return false
  const range = document.createRange()
  range.selectNodeContents(el)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

/**
 * Copies CONTACT_EMAIL. The icon morphs copy → check (two-path stroke draw, f6), the mono label rolls
 * COPY → COPIED, and a polite live region announces it; everything reverts after 2.2s. If the
 * Clipboard API is missing or refuses, the address inside the email CTA is selected instead (and
 * that is announced). The address itself is never animated.
 */
export function CopyEmail({ selectTargetId = "final-email", className }: CopyEmailProps) {
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onClick = async () => {
    clearTimeout(timer.current)
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL)
        ok = true
      }
    } catch {
      ok = false
    }
    if (ok) {
      setCopied(true)
      setMessage("Email address copied")
    } else {
      setCopied(false)
      setMessage(
        selectAddress(selectTargetId)
          ? "Couldn't copy automatically. The email address is selected."
          : `Couldn't copy automatically. The email address is ${CONTACT_EMAIL}.`,
      )
    }
    timer.current = setTimeout(() => {
      setCopied(false)
      setMessage("")
    }, REVERT_MS)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Copy email address"
        onClick={onClick}
        data-state={copied ? "copied" : "idle"}
        className={cn("vf-host", s.copy, className)}
      >
        <svg className={s.copyIcon} viewBox="0 0 18 18" aria-hidden="true">
          <path className={s.glyphPath} d="M6.5 4.5V3.2c0-.66.54-1.2 1.2-1.2h6.6c.66 0 1.2.54 1.2 1.2v6.6c0 .66-.54 1.2-1.2 1.2H13" pathLength={1} />
          <path className={s.glyphPath} d="M3.7 6.5h6.6c.66 0 1.2.54 1.2 1.2v6.6c0 .66-.54 1.2-1.2 1.2H3.7c-.66 0-1.2-.54-1.2-1.2V7.7c0-.66.54-1.2 1.2-1.2z" pathLength={1} />
          <path className={s.checkPath} d="M3.8 9.4l3.4 3.4 7-7.3" pathLength={1} />
        </svg>
        <span className={s.copyLabel} aria-hidden="true">
          <span>COPY</span>
          <span>COPIED</span>
        </span>
        <ViewfinderFrame />
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </span>
    </>
  )
}
