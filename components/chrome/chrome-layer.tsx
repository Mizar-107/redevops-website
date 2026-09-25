"use client"

import { MotionToggle } from "@/components/motion/motion-toggle"
import { Grain } from "./grain"
import { ScrubOsd } from "./scrub-osd"

/**
 * The persistent chrome above the reel (W1): film grain (z-45), the scrub OSD (lg+, bottom-left,
 * only while scrolling) and the MOTION toggle pill (lg+, bottom-right, always visible; the only
 * persistent chrome besides the header).
 */
export function ChromeLayer() {
  return (
    <>
      <Grain />
      <ScrubOsd />
      {/* without JS the toggle could not do anything (and motion is already still): don't show a dead control */}
      <div className="fixed bottom-5 right-6 z-[46] hidden lg:block [html:not(.js)_&]:!hidden">
        <MotionToggle variant="pill" />
      </div>
    </>
  )
}
