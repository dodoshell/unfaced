// Pure layout: where each scene kind puts its text. The components draw exactly these
// boxes, and the checks call this without rendering, so keep React out of this file.
// Every edge sits on the style's 6 px pixel grid.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import { fitFontSize, fitLines } from "../../../../engine/remotion/core/fit.js";
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import style from "../style.json";
import { CELL } from "./pixels.js";

/** Palette roles by position: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4): string => palette[role] ?? style.defaultPalette[role]!;

const down = (v: number) => Math.floor(v / CELL) * CELL;

const TITLE: Rect = { x: 108, y: 474, w: 792, h: 486 };
const BADGE: Rect = { x: 288, y: 396, w: 420, h: 420 };
const MARK: Rect = { x: 342, y: 438, w: 396, h: 396 };
const LIST_X = 108;
const LIST_W = 792;
const LIST_TOP = 300;
/** The captions start at y 1180. */
const LIST_BOTTOM = 1122;
const LIST_GAP = 24;
const HEADER_H = 132;
/** A long list closes the rows up to the drop shadow and a cell, and gives the lead-in less height, so each row keeps a line of text. */
const TIGHT_GAP = 18;
const TIGHT_HEADER_H = 96;

/** Border thickness in cells: ink, two of colour, ink. */
export const BORDER = 4 * CELL;
/** List items: one size for every row, as in a game menu, never below `least`, however many items. */
export const ITEM_SIZE = { max: 60, min: 28, least: 12 };
export const ITEM_FIT = { charWidth: 0.55, lineHeight: 1.1 };
/** The shortest row that holds one line of item text at the smallest size. */
const ROW_MIN = Math.ceil(ITEM_SIZE.min * ITEM_FIT.lineHeight) + 2 * BORDER + 8;

/** A row's number button and the room its text has beside it. Short rows keep the button at least 6 cells. */
export function listRow(box: Rect): { chip: number; room: { w: number; h: number } } {
  const inner = box.h - 2 * BORDER;
  const chip = Math.max(Math.min(inner - 2 * CELL, 14 * CELL), Math.min(6 * CELL, inner));
  return { chip, room: { w: box.w - 2 * BORDER - chip - 60, h: inner - 8 } };
}

/** The one size every row's text gets: the size the longest fits at, smaller still if even one line would not fit a row. */
export function itemSize(items: string[], rows: Rect[]): number {
  const fitted = Math.min(...items.map((text, i) => fitFontSize(text, listRow(rows[i]!).room, ITEM_SIZE.max, ITEM_SIZE.min, ITEM_FIT)));
  const lowest = Math.min(...rows.map((r) => listRow(r).room.h));
  return Math.max(ITEM_SIZE.least, Math.min(fitted, Math.floor(lowest / ITEM_FIT.lineHeight)));
}

/** An item as its row shows it: cut with an ellipsis after the lines its row holds at `size`. */
export function rowText(text: string, box: Rect, size: number): string {
  const { room } = listRow(box);
  return fitLines(text, room.w, size * ITEM_FIT.charWidth, Math.max(1, Math.floor(room.h / (size * ITEM_FIT.lineHeight))));
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
      const n = Math.max(items.length, 1);
      const rows = (gap: number, headerH: number) => {
        const top = header ? LIST_TOP + headerH + gap + CELL : LIST_TOP;
        return { gap, headerH, top, itemH: Math.min(150, down((LIST_BOTTOM - top - (n - 1) * gap) / n)) };
      };
      const loose = rows(LIST_GAP, HEADER_H);
      const { gap, headerH, top, itemH } = loose.itemH >= ROW_MIN ? loose : rows(TIGHT_GAP, TIGHT_HEADER_H);
      const boxes: TextBox[] = header ? [{ id: "header", x: LIST_X, y: LIST_TOP, w: LIST_W, h: headerH }] : [];
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: LIST_X, y: top + i * (itemH + gap), w: LIST_W, h: itemH }));
      return boxes;
    }
  }
}
