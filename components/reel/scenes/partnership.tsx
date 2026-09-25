import { K0, type SceneModule, type SceneProps } from "@/lib/reel/scene"

/** STUB (owned by W5). */
function Furniture(_props: SceneProps) {
  return <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden="true" />
}

export const partnershipScene: SceneModule = {
  id: "partnership",
  label: "PARTNERSHIP",
  beats: ["pair on real systems", "document decisions", "leave the team stronger", "leave the team stronger"],
  beatAt: (v) => (v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3),
  keyShape: () => K0,
  resolve: () => 1,
  smooth: true,
  ariaLabel: "Illustration: your team's track and Recep's track merging, leaving documentation behind",
  Furniture,
}
