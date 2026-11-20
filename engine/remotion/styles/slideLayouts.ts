// Each post-capable style's pure slide layout and font files, importable without React so post
// plans and their checks are built in Node. A style that makes posts adds one line here as well
// as its `slides` in installed.ts.
import { nightTechLayout } from "../../../catalog/styles/13-night-tech/components/slides/layout.js";
import type { SlideKit } from "./registry.js";

/** The part of a SlideKit that needs no React: the font files, the layout, the kinds drawn so far, the ground's family and the colours. */
export type SlideLayout = Pick<SlideKit, "fonts" | "layout" | "kinds" | "ground" | "colours">;

const SLIDE_LAYOUTS = new Map<number, SlideLayout>([[13, nightTechLayout]]);

/** Adds a style's slide layout (for the styles listed above, and for test fixtures). */
export function registerSlideLayout(style: number, kit: SlideLayout): void {
  SLIDE_LAYOUTS.set(style, kit);
}

/** The styles that have a slide layout, in catalog order. */
export const stylesWithSlides = (): number[] => [...SLIDE_LAYOUTS.keys()].sort((a, b) => a - b);

export function getSlideLayout(style: number): SlideLayout {
  const kit = SLIDE_LAYOUTS.get(style);
  if (!kit) throw new Error(`Style ${style} has no slide layout yet; styles with slides: ${stylesWithSlides().join(", ") || "none yet"}`);
  return kit;
}
