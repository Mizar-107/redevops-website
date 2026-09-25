import { cn } from "@/lib/utils"

export type LogoMarkProps = {
  className?: string
  /**
   * Play the intro entrance (header only): the brackets slide in from ±6px (f9 title) at --hero-t0,
   * then the play triangle claps in (--spring-clap, +f3). CSS-timed, never waits for hydration, and
   * only under html[data-motion="full"]; everywhere else the mark is static.
   */
  animate?: boolean
}

/*
 * Plain CSS, hoisted once into <head> by React (href + precedence dedupes it across the header and
 * the footer). Motion keys off html[data-motion="full"] only, so SSR / no-JS / reduced render the
 * final frame. The hover widen uses the independent `translate` property so it composes with the
 * entrance `transform` (whose fill would otherwise pin the brackets in place).
 */
const LOGO_CSS = `
.lm-mark{overflow:visible}
.lm-l,.lm-r{transition:translate var(--f6) var(--ease-title)}
.lm-p{transform-box:fill-box;transform-origin:50% 50%}
@media (hover:hover) and (pointer:fine){
  .lm-host:hover .lm-l{translate:-2px 0}
  .lm-host:hover .lm-r{translate:2px 0}
}
.lm-host:focus-visible .lm-l{translate:-2px 0}
.lm-host:focus-visible .lm-r{translate:2px 0}
@keyframes lm-in-l{from{transform:translateX(-6px);opacity:0}40%{opacity:1}}
@keyframes lm-in-r{from{transform:translateX(6px);opacity:0}40%{opacity:1}}
@keyframes lm-pop{from{transform:scale(0)}}
html[data-motion="full"] .lm-anim .lm-l{animation:lm-in-l var(--f9) var(--ease-title) var(--hero-t0,0ms) both}
html[data-motion="full"] .lm-anim .lm-r{animation:lm-in-r var(--f9) var(--ease-title) var(--hero-t0,0ms) both}
html[data-motion="full"] .lm-anim .lm-p{animation:lm-pop var(--f9) var(--spring-clap) calc(var(--hero-t0,0ms) + var(--f3)) both}
@media (forced-colors:active){.lm-l,.lm-r{stroke:CanvasText}.lm-p{fill:CanvasText}}
`

/**
 * The ReDevOps mark: a viewfinder bracket pair `[ ]` (1.5px signal strokes) around a small play
 * triangle. 32px, server-safe, decorative (the wordmark beside it carries the name). Brackets widen
 * by 2px on hover/focus of the closest `.lm-host` ancestor.
 */
export function LogoMark({ className, animate = false }: LogoMarkProps) {
  return (
    <>
      <style href="rdo-logo-mark" precedence="medium">
        {LOGO_CSS}
      </style>
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className={cn("lm-mark h-8 w-8 shrink-0", animate && "lm-anim", className)}
        {...(animate ? { "data-reveal-intro": "custom" } : {})}
      >
        <path className="lm-l" d="M10.5 6.75H6.75v18.5h3.75" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
        <path className="lm-r" d="M21.5 6.75h3.75v18.5H21.5" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
        <path className="lm-p" d="M13.25 11.25 21 16l-7.75 4.75z" fill="#22D3EE" />
      </svg>
    </>
  )
}
