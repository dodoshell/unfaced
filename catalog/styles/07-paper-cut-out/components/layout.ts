// Pure layout: where each scene kind puts its text. The components draw exactly these
// boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/** Palette roles by position: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

const TITLE: Rect = { x: 120, y: 470, w: 760, h: 500 };
const BADGE: Rect = { x: 300, y: 410, w: 400, h: 400 };
const MARK: Rect = { x: 340, y: 440, w: 400, h: 400 };
const LIST_TOP = 290;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1120;
const LIST_GAP = 26;
const HEADER_H = 150;
/** List strips are pinned a little unevenly: every other one sits further right. */
const STRIP_W = 740;
const STRIP_X = [110, 150];

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
        boxes.push({ id: "header", x: 130, y: top, w: 740, h: HEADER_H });
        top += HEADER_H + LIST_GAP + 6;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(140, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: STRIP_X[i % 2]!, y: top + i * (itemH + LIST_GAP), w: STRIP_W, h: itemH }));
      return boxes;
    }
  }
}
