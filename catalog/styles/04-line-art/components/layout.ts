// Pure layout: where each scene kind puts its text. The components draw exactly these
// boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import { contrast, readableOn } from "../../../../engine/remotion/core/contrast.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/** Palette roles by position: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

/** The lettering colour: the palette's ink, or white or near black when that ink would not read on the background, as when a short dark palette falls back to the default dark ink. */
export function inkColour(palette: string[]): string {
  const ground = colour(palette, 0);
  const ink = colour(palette, 4);
  return contrast(ink, ground) >= 3 ? ink : readableOn(ground, ink);
}

/** Everything text sits on one left margin; the right edge leaves room for the platforms' buttons. */
const LEFT = 120;
const WIDTH = 780;
const TITLE: Rect = { x: LEFT, y: 440, w: WIDTH, h: 520 };
const BADGE: Rect = { x: 290, y: 400, w: 420, h: 420 };
const MARK: Rect = { x: 300, y: 430, w: 400, h: 400 };
const LIST_TOP = 290;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1120;
const HEADER_H = 170;
const ROW_GAP = 16;
const ROW_MAX = 140;

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
        boxes.push({ id: "header", x: LEFT, y: top, w: WIDTH, h: HEADER_H });
        top += HEADER_H + 2 * ROW_GAP;
      }
      const n = Math.max(items.length, 1);
      const rowH = Math.min(ROW_MAX, Math.floor((LIST_BOTTOM - top - (n - 1) * ROW_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: LEFT, y: top + i * (rowH + ROW_GAP), w: WIDTH, h: rowH }));
      return boxes;
    }
  }
}
