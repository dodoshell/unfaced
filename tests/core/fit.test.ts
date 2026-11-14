import { describe, expect, it } from "vitest";
import { fitFontSize, wrapLines } from "../../engine/remotion/core/fit.js";

describe("fitFontSize", () => {
  it("keeps the largest size when the text fits on one line", () => {
    expect(fitFontSize("Hi", { w: 800, h: 200 }, 100, 40)).toBe(100);
  });

  it("shrinks long text until its wrapped lines fit the box", () => {
    const text = "Why does your cat press its paws into your blanket like it is making bread?";
    const size = fitFontSize(text, { w: 700, h: 400 }, 120, 40);
    expect(size).toBeLessThan(120);
    expect(wrapLines(text, 700, size * 0.6).length * size * 1.15).toBeLessThanOrEqual(400);
  });

  it("never goes below the minimum, and fits a font with narrower letters at a larger size", () => {
    expect(fitFontSize("word ".repeat(200), { w: 300, h: 100 }, 80, 30)).toBe(30);
    expect(fitFontSize("A fairly long headline here", { w: 600, h: 300 }, 120, 30, { charWidth: 0.45 })).toBeGreaterThan(fitFontSize("A fairly long headline here", { w: 600, h: 300 }, 120, 30));
  });
});
