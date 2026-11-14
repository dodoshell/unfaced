import { describe, expect, it } from "vitest";
import { leadInColours } from "../../catalog/styles/01-soft-3d/components/layout.js";
import style from "../../catalog/styles/01-soft-3d/style.json";
import { contrast } from "../../engine/remotion/core/contrast.js";

describe("style 01 list lead-in", () => {
  it("reads on its highlight pill with the default, a two-colour and a dark palette", () => {
    for (const palette of [style.defaultPalette, ["#FFFFFF", "#FF0055"], ["#101018", "#FF6B35", "#2EC4B6", "#FFD23F", "#F5F5F5"]]) {
      const { fill, ink } = leadInColours(palette);
      expect(contrast(fill, ink), palette.join(" ")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the palette's own ink where it already reads", () => {
    expect(leadInColours(style.defaultPalette).ink).toBe(style.defaultPalette[4]);
  });
});
