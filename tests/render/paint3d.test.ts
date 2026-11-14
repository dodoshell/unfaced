import { describe, expect, it } from "vitest";
import { splitAlpha } from "../../engine/remotion/core/three/paint.js";

// three.js reads rgba() and #RRGGBBAA colours without their alpha, so a see-through part
// (the blush on a happy face) came out solid on the 3D styles.
describe("3D part colours", () => {
  it("turns the alpha of rgba() and #RRGGBBAA colours into an opacity", () => {
    expect(splitAlpha("rgba(255,110,140,0.55)")).toEqual({ color: "rgb(255, 110, 140)", opacity: 0.55 });
    expect(splitAlpha("rgba(0, 0, 0, 16%)")).toEqual({ color: "rgb(0, 0, 0)", opacity: 0.16 });
    expect(splitAlpha("#FF6E8C80")).toEqual({ color: "#FF6E8C", opacity: 128 / 255 });
  });

  it("leaves solid colours solid", () => {
    expect(splitAlpha("#8B5A2B")).toEqual({ color: "#8B5A2B", opacity: 1 });
    expect(splitAlpha("rgb(1, 2, 3)")).toEqual({ color: "rgb(1, 2, 3)", opacity: 1 });
    expect(splitAlpha("white")).toEqual({ color: "white", opacity: 1 });
  });
});
