import { describe, expect, it } from "vitest";
import { checkFrames } from "../../engine/src/check/frames.js";

const SIZE = 64;
/** A light frame with one bright pixel that moves, so no two neighbours are the same. */
const moving = (i: number) => {
  const f = new Uint8Array(SIZE).fill(200);
  f[i % SIZE] = 255;
  return f;
};
/** A near-black frame with a little encoder noise. */
const black = (i: number) => new Uint8Array(SIZE).map((_, p) => (p + i) % 7);
const still = () => new Uint8Array(SIZE).fill(120);

const run = <T>(n: number, make: (i: number) => T, offset = 0) => Array.from({ length: n }, (_, i) => make(i + offset));

describe("frame checks", () => {
  it("reports one black-frame error at the start of a second of black", () => {
    const frames = [...run(30, moving), ...run(30, black), ...run(30, moving, 30)];
    expect(checkFrames(frames, 30)).toEqual([{ check: "black-frame", atMs: 1000, severity: "error", message: expect.stringContaining("30 frames") }]);
  });

  it("ignores a black flash shorter than 15 frames", () => {
    expect(checkFrames([...run(30, moving), ...run(14, black), ...run(30, moving, 30)], 30)).toEqual([]);
  });

  it("reports 15 identical frames as frozen, but not 14", () => {
    expect(checkFrames([...run(30, moving), ...run(15, still), ...run(30, moving, 30)], 30)).toEqual([
      { check: "frozen-frame", atMs: 1000, severity: "error", message: expect.stringContaining("15 frames") },
    ]);
    expect(checkFrames([...run(30, moving), ...run(14, still), ...run(30, moving, 30)], 30)).toEqual([]);
  });

  it("passes a video where something moves in every frame", () => {
    expect(checkFrames(run(90, moving), 30)).toEqual([]);
  });
});
