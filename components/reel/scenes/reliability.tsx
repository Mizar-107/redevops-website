import { K0, type SceneModule, type SceneProps } from "@/lib/reel/scene"

/** STUB (owned by W5). */
function Furniture(_props: SceneProps) {
  return <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" />
}

export const reliabilityScene: SceneModule = {
  id: "reliability",
  label: "RELIABILITY",
  beats: ["monitoring", "alerting", "runbooks", "incident practice"],
  beatAt: (v) => (v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3),
  keyShape: () => K0,
  resolve: () => 1,
  smooth: true,
  ariaLabel: "Illustration: noisy alerts settling into one actionable alert with a runbook",
  Furniture,
}
