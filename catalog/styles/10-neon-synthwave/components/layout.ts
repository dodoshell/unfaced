// Pure layout for style 10: where each scene kind puts its text. The components draw exactly
// these boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import { fitFontSize, wrapLines } from "../../../../engine/remotion/core/fit.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/** Palette roles by position: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

/** The horizon: sky and sun above, the grid floor below. The captions start right under it. */
export const HORIZON = 1180;

const TITLE: Rect = { x: 110, y: 430, w: 780, h: 500 };
const BADGE: Rect = { x: 290, y: 370, w: 420, h: 420 };
const MARK: Rect = { x: 340, y: 420, w: 400, h: 400 };
const LIST_TOP = 290;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1120;
const LIST_GAP = 24;
const HEADER_H = 140;

/** Room between the title's sign and its lettering: the neon tube and the glow need it. */
export const TITLE_PAD = { x: 54, y: 48 };

/** Average letter widths (share of the font size), measured on English text plus a margin for the glow. */
const MONOTON = { charWidth: 0.8, lineHeight: 1.2 };
export const ORBITRON = { charWidth: 0.7, lineHeight: 1.18 };
/** Below this Monoton's inline strokes run together, so a longer hook is set in Orbitron. */
export const MONOTON_MIN = 76;

/** The hook's font and size: Monoton, the neon sign face, when it fits large enough, else Orbitron. */
export function titleType(text: string, box: { w: number; h: number }): { font: "display" | "text"; size: number } {
  const inner = { w: box.w - 2 * TITLE_PAD.x, h: box.h - 2 * TITLE_PAD.y };
  const size = fitFontSize(text, inner, 120, MONOTON_MIN, MONOTON);
  const lines = wrapLines(text, inner.w, size * MONOTON.charWidth);
  const widest = Math.max(...text.split(/\s+/).map((w) => w.length * size * MONOTON.charWidth));
  if (widest <= inner.w && lines.length * size * MONOTON.lineHeight <= inner.h) return { font: "display", size };
  return { font: "text", size: fitFontSize(text, inner, 92, 40, ORBITRON) };
}

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
        top += HEADER_H + LIST_GAP + 8;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(150, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: 110, y: top + i * (itemH + LIST_GAP), w: 780, h: itemH }));
      return boxes;
    }
  }
}
