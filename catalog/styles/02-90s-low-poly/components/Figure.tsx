import type { FigureProps } from "../../../../engine/remotion/kit/index.js";
import { Figure3D, type Look3D } from "../../../../engine/remotion/core/three/Figure3D.js";
import { ARCADE } from "./shared.js";

/** Six sides to a sphere, hard facets and a strong key light, so every face reads on its own. */
const LOW_POLY: Look3D = { segments: 6, flatShading: true, roughness: 1, depth: 0.85, light: { ambient: 0.95, key: 2.6, fill: 0.55 }, font: ARCADE };

/** Characters as a 1997 console game would draw them: a handful of flat-shaded polygons. */
export const Figure: React.FC<FigureProps> = (props) => <Figure3D {...props} look={LOW_POLY} />;
