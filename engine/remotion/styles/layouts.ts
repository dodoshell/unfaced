// Each style's pure text layout, importable without React or fonts so checks can run
// in Node. A style with components adds one line here as well as in installed.ts.
import { layout as softThreeD } from "../../../catalog/styles/01-soft-3d/components/layout.js";
import { layout as flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/layout.js";
import type { StyleKit } from "./registry.js";

const LAYOUTS = new Map<number, StyleKit["layout"]>([
  [1, softThreeD],
  [3, flatCartoon],
]);
/** Styles whose last scene draws the ending's sign itself, inside one of its own boxes. */
const DRAW_ENDING_MARK = new Set<number>([3]);

/** The styles that have a layout, in catalog order. */
export const stylesWithLayout = (): number[] => [...LAYOUTS.keys()].sort((a, b) => a - b);

export function getLayout(style: number): StyleKit["layout"] {
  const layout = LAYOUTS.get(style);
  if (!layout) throw new Error(`Style ${style} has no layout yet; styles with a layout: ${[...LAYOUTS.keys()].join(", ")}`);
  return layout;
}

/** Whether the style draws the ending's sign itself (otherwise the engine draws it in END_MARK_BOX, whatever scene the ending has). */
export const drawsEndingMark = (style: number): boolean => DRAW_ENDING_MARK.has(style);
