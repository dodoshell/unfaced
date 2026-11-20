import type React from "react";
import type { SlideColours, SlideContext } from "../styles/registry.js";

/**
 * A slide drawn by code written for one post (its `custom/` folder). It draws the content only;
 * the style's view draws the ground and the frame around it. `colours` are the post style's
 * colours by name for the page's palette, so the slide matches any style without importing it.
 */
export type SlideComponent = React.FC<{ ctx: SlideContext; colours: SlideColours }>;

let custom: Record<string, SlideComponent> = {};

/** Slides by the id a `## custom {id: phone}` slide names; what a post's custom/index.tsx exports. */
export function defineSlides(slides: Record<string, SlideComponent>): Record<string, SlideComponent> {
  return slides;
}

/**
 * Called by the generated entry point of a post with a custom/ folder; `file` is its index.tsx
 * and `ids` the custom slides the post uses. It runs when the bundle loads, so a mistake stops
 * the render before any slide is drawn.
 */
export function setPostSlides(slides: Record<string, SlideComponent>, file: string, ids: string[] = []): void {
  if (!slides || typeof slides !== "object") {
    throw new Error(`${file} must export its slides by default: end it with export default defineSlides({ phone: PhoneSlide }), naming each slide by its id`);
  }
  const have = Object.keys(slides);
  for (const id of ids) {
    if (!slides[id]) throw new Error(`${file} does not export a slide "${id}", which slides.md uses; it exports ${have.map((k) => `"${k}"`).join(", ") || "none"}`);
  }
  custom = slides;
}

/** The post's own slide for an id, if it has one. */
export function postSlide(id: string): SlideComponent | undefined {
  return custom[id];
}
