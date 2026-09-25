"use client"

import { MotionToggle } from "@/components/motion/motion-toggle"

/** STUB (owned by W1): grain + scrub OSD + motion toggle. */
export function ChromeLayer() {
  return (
    <div className="pointer-events-none fixed bottom-5 right-6 z-[46] hidden lg:block">
      <MotionToggle variant="pill" className="pointer-events-auto" />
    </div>
  )
}
