// Lettering must read whatever palette a page brings. Styles 04 and 11 write straight on the
// background, with no card behind the words; 08 letters its list lead-in on the highlight
// colour, and 05 draws its gold (the highlight) on the night at the top of the sky.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as lineArt from "../../catalog/styles/04-line-art/components/layout.js";
import * as silhouette from "../../catalog/styles/05-ink-silhouette/components/layout.js";
import * as comic from "../../catalog/styles/08-vintage-comic/components/layout.js";
import * as watercolour from "../../catalog/styles/11-watercolour/components/layout.js";
import { contrast } from "../../engine/remotion/core/contrast.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";

describe.each([
  ["04-line-art", lineArt],
  ["11-watercolour", watercolour],
] as const)("style %s lettering", (folder, style) => {
  const defaults = (JSON.parse(readFileSync(join(CATALOG_DIR, "styles", folder, "style.json"), "utf8")) as { defaultPalette: string[] }).defaultPalette;

  it("is the palette's own ink when it reads on the background", () => {
    expect(style.inkColour(defaults)).toBe(defaults[4]);
    expect(style.inkColour(["#101018", "#FF6B35", "#2EC4B6", "#FFD23F", "#F5F5F5"])).toBe("#F5F5F5");
  });

  it("turns light on a short dark palette, whose missing ink falls back to the default dark one", () => {
    const palette = ["#1E2A3A", "#4F82B3"];
    expect(contrast(style.inkColour(palette), palette[0]!)).toBeGreaterThanOrEqual(3);
  });

  it("turns dark when a page gives a light ink on a light background", () => {
    const palette = ["#FFFFFF", "#FF0055", "#00AAFF", "#FFDD00", "#F5F5F5"];
    expect(contrast(style.inkColour(palette), palette[0]!)).toBeGreaterThanOrEqual(3);
  });
});

/** A page whose highlight is dark: navy. */
const navy = ["#F4E1C1", "#E07A5F", "#3D405B", "#1B2A6B", "#1B1B1B"];

describe("style 08-vintage-comic's list lead-in, lettered on the highlight", () => {
  it("is the dark line colour on the default yellow", () => {
    expect(comic.leadInInk(["#F1E2BF", "#D7312A", "#2C78BA", "#F6C833", "#1D1712"], "#1D1712")).toBe("#1D1712");
  });

  it("turns light on a dark highlight", () => {
    expect(contrast(comic.leadInInk(navy, "#17120E"), "#1B2A6B")).toBeGreaterThanOrEqual(3);
  });
});

describe("style 05-ink-silhouette's gold, on the night at the top of the sky", () => {
  it("is the palette's highlight when it reads there", () => {
    expect(silhouette.goldOn(["#F7C46C", "#D9573B", "#4E2753", "#FFC14D", "#120D16"])).toBe("#FFC14D");
  });

  it("is lifted towards white when the highlight is too dark to read on the night", () => {
    expect(contrast(silhouette.goldOn(navy), silhouette.nightSky(navy))).toBeGreaterThanOrEqual(3);
  });
});
