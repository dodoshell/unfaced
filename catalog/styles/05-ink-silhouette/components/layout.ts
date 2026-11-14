// Pure layout: where each scene kind puts its text. The components draw exactly these
// boxes, and the checks call this without rendering, so keep React out of this file.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import { liftedOn, mix } from "../../../../engine/remotion/core/contrast.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";

/**
 * Palette roles by position: 0 background (the glow on the horizon), 1 accent (the low sky),
 * 2 secondary (the high sky), 3 highlight (sun, moon and ornaments), 4 ink (the silhouettes).
 * Short page palettes fall back to the defaults.
 */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

/** The top of the sky: the high sky darkened towards night, so white type reads on any palette. */
export const nightSky = (palette: string[]): string => mix(colour(palette, 2), "#000000", 0.62);

/** The highlight as the gold of the ornaments, numerals and lead-in: lifted towards white when it would not read on the night sky. */
export const goldOn = (palette: string[]): string => liftedOn(nightSky(palette), colour(palette, 3));

/** Cinzel's average letter width with the style's letter spacing, as a share of the font size. */
export const CINZEL = { charWidth: 0.66, lineHeight: 1.18 };
/** The same with the list lead-in's wider letter spacing (0.1em) and tighter lines. */
export const CINZEL_WIDE = { charWidth: 0.72, lineHeight: 1.1 };

const TITLE: Rect = { x: 110, y: 300, w: 780, h: 620 };
/** The moon of the fact and outro scenes; the same disc in both, so it stays put across a cut. */
const MOON: Rect = { x: 330, y: 380, w: 420, h: 420 };
const LIST_TOP = 280;
/** Kept well above the captions (y 1180) and the hill, in the darker part of the sky. */
const LIST_BOTTOM = 1080;
const LIST_GAP = 16;
const HEADER_H = 150;

export function layout(scene: Scene, _palette: string[]): TextBox[] {
  switch (scene.kind) {
    case "title":
      return [{ id: "headline", ...TITLE }];
    case "fact":
      return [{ id: "badge", ...MOON }];
    case "outro":
      return [{ id: "mark", ...MOON }];
    case "list": {
      const { header, items } = listParts(scene.text);
      const boxes: TextBox[] = [];
      let top = LIST_TOP;
      if (header) {
        boxes.push({ id: "header", x: 110, y: top, w: 780, h: HEADER_H });
        top += HEADER_H + LIST_GAP + 12;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(128, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: 110, y: top + i * (itemH + LIST_GAP), w: 780, h: itemH }));
      return boxes;
    }
  }
}
