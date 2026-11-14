import type { FigureProps } from "../../../../engine/remotion/kit/index.js";
import { Figure3D, type Look3D } from "../../../../engine/remotion/core/three/Figure3D.js";
import { FONT } from "./shared.js";

const CLAY: Look3D = { segments: 40, flatShading: false, roughness: 0.85, depth: 0.9, light: { ambient: 1.3, key: 2.2, fill: 0.8 }, font: FONT };

/** Characters as soft clay: smooth, matte, lit from the top left. */
export const Figure: React.FC<FigureProps> = (props) => <Figure3D {...props} look={CLAY} />;
