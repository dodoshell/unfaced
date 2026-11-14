import { describe, expect, it } from "vitest";
import { snapToPauses } from "../../engine/src/timing/snap.js";

const w = (text: string, startMs: number, endMs: number) => ({ text, startMs, endMs });
const pause = (fromMs: number, toMs: number) => ({ fromMs, toMs });

describe("snapToPauses", () => {
  it("starts the first word after each pause where the voice starts again", () => {
    const words = [w("Why", 220, 420), w("purr?", 1400, 1700), w("Because", 1880, 2200), w("it", 2200, 2400)];
    expect(snapToPauses(words, [pause(0, 50), pause(1500, 1680)])).toEqual([w("Why", 50, 420), w("purr?", 1400, 1680), w("Because", 1680, 2200), w("it", 2200, 2400)]);
  });

  it("finds the word when whisper stretched it back over the pause", () => {
    const words = [w("wrong.", 3680, 3681), w("Most", 3681, 4640), w("adult", 4640, 5040)];
    expect(snapToPauses(words, [pause(3720, 4220)])).toEqual([w("wrong.", 3680, 3681), w("Most", 4220, 4640), w("adult", 4640, 5040)]);
  });

  it("moves a word whisper started too early to the end of the pause", () => {
    expect(snapToPauses([w("so", 28500, 28700), w("it", 28840, 29000)], [pause(28720, 28890)])).toEqual([w("so", 28500, 28700), w("it", 28890, 29000)]);
  });

  it("ignores a pause with no word starting within 800 ms of its end", () => {
    const words = [w("Cats", 1000, 1300)];
    expect(snapToPauses(words, [pause(0, 100)])).toEqual(words);
  });
});
