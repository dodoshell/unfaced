import type { Rect } from "./safeZone.js";

/** Where captions are drawn: the lower middle of the frame, inside the safe zone. */
export const CAPTION_BOX: Rect = { x: 60, y: 1180, w: 880, h: 330 };

export const CAPTION_FONT_SIZE = 76;

/** Words that follow each other within this gap share one caption page. */
export const CAPTION_COMBINE_MS = 1200;
