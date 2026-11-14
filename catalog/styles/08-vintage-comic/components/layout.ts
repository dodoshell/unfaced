// Pure layout: where each scene kind puts its text. The components draw exactly these
// boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/** Palette roles by position: 0 background (the paper), 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

/** Bangers' average letter width with the style's letter spacing, as a share of the font size. */
export const BANGERS = { charWidth: 0.46, lineHeight: 1.06 };

/** The words of the hook, inside the speech balloon (the balloon itself reaches further). */
const TITLE: Rect = { x: 140, y: 385, w: 720, h: 500 };
const BADGE: Rect = { x: 290, y: 400, w: 420, h: 420 };
const MARK: Rect = { x: 340, y: 410, w: 400, h: 400 };
const LIST_TOP = 290;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1110;
const LIST_GAP = 22;
const HEADER_H = 128;

export function layout(scene: Scene, _palette: string[]): TextBox[] {
  switch (scene.kind) {
    case "title":
      return [{ id: "headline", ...TITLE }];
    case "fact":
      return [{ id: "badge", ...BADGE }];
    case "outro":
      return [{ id: "mark", ...MARK }];
    case "list": {
      const { header, items } = listParts(scene.text);
      const boxes: TextBox[] = [];
      let top = LIST_TOP;
      if (header) {
        boxes.push({ id: "header", x: 110, y: top, w: 780, h: HEADER_H });
        top += HEADER_H + LIST_GAP + 14;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(140, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: 110, y: top + i * (itemH + LIST_GAP), w: 780, h: itemH }));
      return boxes;
    }
  }
}
