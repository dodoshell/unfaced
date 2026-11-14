// Styles 02 and 09 draw each list item in a thick framed row with a number button, so a long
// list leaves little room inside each row. These pin that every row still holds readable text
// and a readable number, and that an item too long for its row is cut, not spilled.
import { describe, expect, it } from "vitest";
import * as lowPoly from "../../catalog/styles/02-90s-low-poly/components/layout.js";
import * as pixel from "../../catalog/styles/09-16-bit-pixel-art/components/layout.js";
import { listParts } from "../../engine/remotion/core/badges.js";
import { wrapLines } from "../../engine/remotion/core/fit.js";
import type { Scene } from "../../engine/src/plan/types.js";

const LONG = "cats knead soft blankets with both front paws when they feel safe and warm";
const list = (n: number, header: boolean): Scene => ({
  beatId: "b2",
  kind: "list",
  text: [header ? "Things cats do:" : "", ...Array.from({ length: n }, (_, i) => `- ${i + 1} ${LONG}`)].filter(Boolean).join("\n"),
  fromFrame: 0,
  durationInFrames: 90,
  words: [],
});

/** The smallest item text a list in these styles may get while it has no more items than script.md allows. */
const READABLE = 24;

describe.each([
  ["02 90s low poly", lowPoly],
  ["09 16-bit pixel art", pixel],
] as const)("style %s list rows", (_, style) => {
  const lines = (text: string, w: number, size: number) => wrapLines(text, w, size * style.ITEM_FIT.charWidth).length;
  const rowsOf = (scene: Scene) => style.layout(scene, []).filter((b) => b.id.startsWith("item"));

  it.each([1, 3, 5, 6, 7])("keep the text and the number readable with %i items, with or without a lead-in", (n) => {
    for (const header of [true, false]) {
      const scene = list(n, header);
      const rows = rowsOf(scene);
      expect(rows).toHaveLength(n);
      expect(style.itemSize(listParts(scene.text).items, rows), `${n} items`).toBeGreaterThanOrEqual(READABLE);
      for (const row of rows) expect(style.listRow(row).chip, `${n} items, ${row.id}`).toBeGreaterThanOrEqual(36);
    }
  });

  it("keep the rows of a short list as tall as before", () => {
    expect(rowsOf(list(3, true)).every((r) => r.h === 150)).toBe(true);
  });

  it.each([9, 12, 20])("never draw item text below 12 px, even with %i items (make warns past 7)", (n) => {
    const scene = list(n, true);
    expect(style.itemSize(listParts(scene.text).items, rowsOf(scene))).toBeGreaterThanOrEqual(12);
  });

  it.each([6, 7, 8])("keep every row's text inside its frame with %i long items", (n) => {
    const scene = list(n, true);
    const rows = rowsOf(scene);
    const size = style.itemSize(listParts(scene.text).items, rows);
    for (const row of rows) {
      const { room } = style.listRow(row);
      expect(size * style.ITEM_FIT.lineHeight, `${n} items, one line in ${row.id}`).toBeLessThanOrEqual(room.h);
      const shown = style.rowText(LONG, row, size);
      expect(lines(shown, room.w, size) * size * style.ITEM_FIT.lineHeight, `${n} items, ${row.id}`).toBeLessThanOrEqual(room.h);
    }
  });

  it("cut an item too long for its row, ending it with an ellipsis", () => {
    const scene = list(7, true);
    const row = rowsOf(scene)[0]!;
    const size = style.itemSize(listParts(scene.text).items, rowsOf(scene));
    expect(lines(LONG, style.listRow(row).room.w, size) * size * style.ITEM_FIT.lineHeight, "the item alone would spill").toBeGreaterThan(style.listRow(row).room.h);
    expect(style.rowText(LONG, row, size).endsWith("…")).toBe(true);
  });

  it("show an item that fits its row unchanged", () => {
    expect(style.rowText("water", rowsOf(list(3, true))[0]!, 60)).toBe("water");
  });
});
