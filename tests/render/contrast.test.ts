import { describe, expect, it } from "vitest";
import { contrast, liftedOn, mix, readableOn } from "../../engine/remotion/core/contrast.js";

describe("colour contrast", () => {
  it("measures the WCAG ratio, from 1 to 21", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21);
    expect(contrast("#777777", "#777777")).toBe(1);
  });

  it("keeps the colour asked for when it reads on the background", () => {
    expect(readableOn("#FFF4E0", "#1B1B3A")).toBe("#1B1B3A");
  });

  it("swaps in white or near black when it does not, as with a dark ink on a dark sky", () => {
    expect(readableOn("#14062F", "#08020F")).toBe("#FFFFFF");
    expect(readableOn("#FFFFFF", "#F1EEE4")).toBe("#1B1B1F");
  });

  it("mixes two colours, a share of the way from the first to the second", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mix("#FF0000", "#0000FF", 0)).toBe("#FF0000");
    expect(mix("#FF0000", "#0000FF", 1)).toBe("#0000FF");
  });

  it("lifts a colour towards white or black only as far as it needs to read, keeping its hue", () => {
    expect(liftedOn("#0B0820", "#F2C14E")).toBe("#F2C14E");
    const navy = liftedOn("#0B0820", "#1B2A6B");
    expect(contrast(navy, "#0B0820")).toBeGreaterThanOrEqual(3);
    expect(navy).not.toBe("#FFFFFF");
    expect(contrast(liftedOn("#FFF8E8", "#FFE08A", 4.5), "#FFF8E8")).toBeGreaterThanOrEqual(4.5);
  });

  it("is in the kit, for a style's own code", async () => {
    const kit = await import("../../engine/remotion/kit/index.js");
    for (const name of ["contrast", "luminance", "readableOn", "mix", "liftedOn"]) expect(typeof (kit as Record<string, unknown>)[name], name).toBe("function");
  });
});
