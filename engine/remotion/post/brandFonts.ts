import { staticFile } from "remotion";
import type { PostPlan } from "../../src/post/buildPostPlan.js";
import { loadFont } from "../core/loadFont.js";
import { SLIDE_FONT_ROLES, slideFont, slideFontFile } from "./slideFonts.js";

/**
 * Loads the plan's four fonts (the brand's files where it has them, the style's otherwise),
 * staged into the render's public folder by renderPost; frames wait until they are ready.
 */
export function loadSlideFonts(plan: PostPlan): void {
  for (const role of SLIDE_FONT_ROLES) loadFont(slideFont(role), staticFile(slideFontFile(role, plan.fonts[role])));
}
