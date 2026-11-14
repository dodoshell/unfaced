import { describe, expect, it } from "vitest";
import { chalk, contrast, lightBoard } from "../../catalog/styles/06-chalkboard/components/colours.js";
import style from "../../catalog/styles/06-chalkboard/style.json";

const [board, accent, secondary, , ink] = style.defaultPalette as [string, string, string, string, string];
const grey = (v: number) => `#${v.toString(16).padStart(2, "0").repeat(3)}`;

describe("style 06 chalk colours", () => {
  it("keep the default palette as it is", () => {
    expect([chalk([], 4), chalk([], 1), chalk([], 2)]).toEqual([ink, accent, secondary]);
    expect(lightBoard([])).toBe(false);
  });

  it("turn an ink too close to the board into chalk that reads, on every board from black to white", () => {
    for (let v = 0; v <= 255; v += 15) {
      const page = [grey(v), accent, secondary, accent, grey(v)];
      expect(contrast(chalk(page, 4), grey(v))).toBeGreaterThanOrEqual(3);
    }
  });

  it("write dark chalk on a light board", () => {
    const page = ["#F4F2EC", accent, secondary, accent, "#FFFFFF"];
    expect(lightBoard(page)).toBe(true);
    expect(chalk(page, 4)).toBe("#22302A");
  });

  it("move a coloured chalk that vanishes into the board towards the ink", () => {
    const faint = "#2B4034";
    const page = [board, faint, secondary, accent, ink];
    expect(chalk(page, 1)).not.toBe(faint);
    expect(contrast(chalk(page, 1), board)).toBeGreaterThan(contrast(faint, board) + 1);
  });
});
