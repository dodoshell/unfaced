// Each style's pure text layout, importable without React or fonts so checks can run
// in Node. A style with components adds one line here as well as in installed.ts.
import { layout as flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/layout.js";
import type { StyleKit } from "./registry.js";

const LAYOUTS = new Map<number, StyleKit["layout"]>([[3, flatCartoon]]);

export function getLayout(style: number): StyleKit["layout"] {
  const layout = LAYOUTS.get(style);
  if (!layout) throw new Error(`Style ${style} has no layout yet; styles with a layout: ${[...LAYOUTS.keys()].join(", ")}`);
  return layout;
}
