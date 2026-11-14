import { describe, expect, it } from "vitest";
import { BIG, CELL, mix, type Raster, rasterise, snes, tone } from "../../catalog/styles/09-16-bit-pixel-art/components/pixels.js";
import type { Part } from "../../engine/remotion/core/character/types.js";

const INK = "#1A1C2C";
const disc = (r: number, fill = "#41A6F6", cy = 0): Part => ({ kind: "ellipse", role: "body", cx: 0, cy, rx: r, ry: r, rotate: 0, fill });

/** The painted cells as "column,row" on the screen's grid → colour. */
function cells(raster: Raster, cell = CELL): Map<string, string> {
  const out = new Map<string, string>();
  for (const { colour, d } of raster.paths) {
    for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
      const [i, j] = [(raster.x + Number(x)) / cell, (raster.y + Number(y)) / cell];
      for (let k = 0; k < Number(w) / cell; k++) out.set(`${i + k},${j}`, colour);
    }
  }
  return out;
}

const around = (key: string) => {
  const [i, j] = key.split(",").map(Number) as [number, number];
  return [`${i - 1},${j}`, `${i + 1},${j}`, `${i},${j - 1}`, `${i},${j + 1}`];
};

const onFifteenBits = (c: string) => [1, 3, 5].every((at) => Number.parseInt(c.slice(at, at + 2), 16) % 8 === 0);

describe("style 09 pixel rasteriser", () => {
  it("puts every cell on the grid, wherever the parts are and whatever their scale", () => {
    for (const cell of [CELL, BIG]) {
      const raster = rasterise([disc(10)], { x: 103.7, y: 211.2, scale: 2.3, cell, outline: INK, shade: true });
      expect([raster.x, raster.y, raster.width, raster.height].every((v) => v % cell === 0)).toBe(true);
      const numbers = raster.paths.flatMap((p) => [...p.d.matchAll(/-?\d+(\.\d+)?/g)].map((m) => Number(m[0])));
      expect(numbers.length).toBeGreaterThan(0);
      expect(numbers.every((v) => v % cell === 0)).toBe(true);
    }
  });

  it("draws a one-cell outline all round the silhouette", () => {
    const fill = snes([65, 166, 246]);
    const ink = snes([26, 28, 44]);
    const map = cells(rasterise([disc(12)], { x: 300, y: 300, scale: 3, outline: INK }));
    const [inside, outline] = [[...map].filter(([, c]) => c === fill), [...map].filter(([, c]) => c === ink)];
    expect(inside.length).toBeGreaterThan(20);
    // No filled cell touches the empty sky, and every outline cell touches the fill.
    expect(inside.every(([key]) => around(key).every((n) => map.has(n)))).toBe(true);
    expect(outline.every(([key]) => around(key).some((n) => map.get(n) === fill))).toBe(true);
  });

  it("never loses a feature smaller than a cell", () => {
    const eye: Part = { kind: "ellipse", role: "eye", cx: 2, cy: -3, rx: 0.3, ry: 0.4, rotate: 0, fill: "#000000" };
    const mouth: Part = { kind: "stroke", role: "mouth", points: [[-4, 4], [0, 5], [4, 4]], width: 0.2, colour: "#F80000", line: true };
    const map = cells(rasterise([disc(10), eye, mouth], { x: 300, y: 300, scale: 2, outline: INK, shade: true }));
    const colours = [...map.values()];
    expect(colours.filter((c) => c === "#000000").length).toBeGreaterThanOrEqual(1);
    expect(colours.filter((c) => c === "#F80000").length).toBeGreaterThanOrEqual(2);
  });

  it("snaps every colour it paints, shades and outlines included, to 15-bit colour", () => {
    expect(snes([255, 3, 130])).toBe("#F80080");
    expect(onFifteenBits(tone("#41A6F7", 0.24))).toBe(true);
    expect(onFifteenBits(mix("#41A6F7", "#FFCD75", 0.3))).toBe(true);
    const raster = rasterise([disc(10, "#41A6F7"), disc(4, "#B13E53", -4)], { x: 300, y: 300, scale: 3, outline: INK, shade: true });
    const colours = raster.paths.map((p) => p.colour);
    expect(colours.length).toBeGreaterThanOrEqual(4);
    expect(colours.every(onFifteenBits)).toBe(true);
  });
});
