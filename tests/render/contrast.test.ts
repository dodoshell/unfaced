import { describe, expect, it } from "vitest";
import { contrast, readableOn } from "../../engine/remotion/core/contrast.js";

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
});
