// Each style's pure text layout, importable without React or fonts so checks can run
// in Node. A style with components adds one line here as well as in installed.ts.
import { layout as softThreeD } from "../../../catalog/styles/01-soft-3d/components/layout.js";
import { layout as lowPoly } from "../../../catalog/styles/02-90s-low-poly/components/layout.js";
import { layout as flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/layout.js";
import { layout as lineArt } from "../../../catalog/styles/04-line-art/components/layout.js";
import { layout as inkSilhouette } from "../../../catalog/styles/05-ink-silhouette/components/layout.js";
import { layout as chalkboard } from "../../../catalog/styles/06-chalkboard/components/layout.js";
import { layout as paperCutOut } from "../../../catalog/styles/07-paper-cut-out/components/layout.js";
import { layout as vintageComic } from "../../../catalog/styles/08-vintage-comic/components/layout.js";
import { layout as pixelArt } from "../../../catalog/styles/09-16-bit-pixel-art/components/layout.js";
import { layout as neonSynthwave } from "../../../catalog/styles/10-neon-synthwave/components/layout.js";
import { layout as watercolour } from "../../../catalog/styles/11-watercolour/components/layout.js";
import { layout as kineticTypography } from "../../../catalog/styles/12-kinetic-typography/components/layout.js";
import type { StyleKit } from "./registry.js";

const LAYOUTS = new Map<number, StyleKit["layout"]>([
  [1, softThreeD],
  [2, lowPoly],
  [3, flatCartoon],
  [4, lineArt],
  [5, inkSilhouette],
  [6, chalkboard],
  [7, paperCutOut],
  [8, vintageComic],
  [9, pixelArt],
  [10, neonSynthwave],
  [11, watercolour],
  [12, kineticTypography],
]);
/** Styles whose last scene draws the ending's sign itself, inside one of its own boxes. */
const DRAW_ENDING_MARK = new Set<number>([3, 4, 5, 6, 8, 9, 10, 12]);

/** The styles that have a layout, in catalog order. */
export const stylesWithLayout = (): number[] => [...LAYOUTS.keys()].sort((a, b) => a - b);

export function getLayout(style: number): StyleKit["layout"] {
  const layout = LAYOUTS.get(style);
  if (!layout) throw new Error(`Style ${style} has no layout yet; styles with a layout: ${[...LAYOUTS.keys()].join(", ")}`);
  return layout;
}

/** Whether the style draws the ending's sign itself (otherwise the engine draws it in END_MARK_BOX, whatever scene the ending has). */
export const drawsEndingMark = (style: number): boolean => DRAW_ENDING_MARK.has(style);
