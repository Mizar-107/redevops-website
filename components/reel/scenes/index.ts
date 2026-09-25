import type { SceneModule } from "@/lib/reel/scene"
import { costScene } from "./cost"
import { reliabilityScene } from "./reliability"
import { deliveryScene } from "./delivery"
import { partnershipScene } from "./partnership"

/** The four Services scenes, in reel order. */
export const SCENES: readonly SceneModule[] = [costScene, reliabilityScene, deliveryScene, partnershipScene]
