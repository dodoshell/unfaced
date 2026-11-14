import { describe, expect, it } from "vitest";
import { evenOutCrushedWords, snapToPauses } from "../../engine/src/timing/snap.js";

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

describe("evenOutCrushedWords", () => {
  it("gives a word whisper squeezed to almost nothing a share of the long word before it", () => {
    const words = [w("press", 1020, 1320), w("its", 1320, 1900), w("paws", 1900, 1901), w("into", 1901, 2440)];
    const out = evenOutCrushedWords(words);
    expect(out[2]!.endMs).toBe(1901);
    expect(out[2]!.endMs - out[2]!.startMs).toBeGreaterThanOrEqual(150);
    expect(out[1]!.endMs).toBe(out[2]!.startMs);
    expect(out[1]!.endMs - out[1]!.startMs).toBeGreaterThanOrEqual(150);
    expect([out[0], out[3]]).toEqual([words[0], words[3]]);
  });

  it("leaves short words alone when they are short in the voice too, or follow a pause", () => {
    const fine = [w("make", 6830, 7280), w("a", 7290, 7340), w("bed", 7340, 7700)];
    expect(evenOutCrushedWords(fine)).toEqual(fine);
    const afterPause = [w("so", 23780, 23880), w("it", 24300, 24310)];
    expect(evenOutCrushedWords(afterPause)).toEqual(afterPause);
  });
});
