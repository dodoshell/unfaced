// Each post-capable style's SlideView, for the post compositions. A style that makes posts
// registers its view here from installed.ts, and its pure layout in slideLayouts.ts; a style
// does not need video scenes to make posts. Test entry points register fixture views.
import type { SlideKit } from "./registry.js";

const SLIDE_VIEWS = new Map<number, SlideKit["SlideView"]>();

export function registerSlideView(style: number, view: SlideKit["SlideView"]): void {
  SLIDE_VIEWS.set(style, view);
}

export function getSlideView(style: number): SlideKit["SlideView"] {
  const view = SLIDE_VIEWS.get(style);
  if (!view) {
    const ready = [...SLIDE_VIEWS.keys()].sort((a, b) => a - b).join(", ") || "none yet";
    throw new Error(`Style ${style} has no slide view yet; styles with slide views: ${ready}`);
  }
  return view;
}
