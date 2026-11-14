// Pure layout for style 12: where each scene kind puts its text. The components draw exactly
// these boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/** Palette roles by position: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

/** The type column: the whole width of the safe zone. */
const LEFT = 60;
const WIDTH = 880;

/** The hook, stacked line by line, down to just above the captions (the title has none). */
const HEADLINE: Rect = { x: LEFT, y: 250, w: WIDTH, h: 900 };
/** The fact's number, top left. */
const BADGE: Rect = { x: LEFT, y: 240, w: 360, h: 180 };
/** The stage: the key word of the phrase being said, as big as it goes. */
const STAGE: Rect = { x: LEFT, y: 470, w: WIDTH, h: 620 };
/** The ending's sign, top left (the engine's sign box, top centre, stays clear). */
const MARK: Rect = { x: LEFT, y: 240, w: 260, h: 260 };
const OUTRO_STAGE: Rect = { x: LEFT, y: 560, w: WIDTH, h: 540 };
const LIST_TOP = 240;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1120;
const LIST_GAP = 18;
const HEADER_H = 190;
const ITEM_MAX = 200;

export function layout(scene: Scene, _palette: string[]): TextBox[] {
  switch (scene.kind) {
    case "title":
      return [{ id: "headline", ...HEADLINE }];
    case "fact":
      return [
        { id: "badge", ...BADGE },
        { id: "stage", ...STAGE },
      ];
    case "outro":
      return [
        { id: "mark", ...MARK },
        { id: "stage", ...OUTRO_STAGE },
      ];
    case "list": {
      const { header, items } = listParts(scene.text);
      const boxes: TextBox[] = [];
      let top = LIST_TOP;
      if (header) {
        boxes.push({ id: "header", x: LEFT, y: top, w: WIDTH, h: HEADER_H });
        top += HEADER_H + LIST_GAP + 16;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(ITEM_MAX, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: LEFT, y: top + i * (itemH + LIST_GAP), w: WIDTH, h: itemH }));
      return boxes;
    }
  }
}
