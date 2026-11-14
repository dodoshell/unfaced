import { describe, expect, it } from "vitest";
import { READING_LEAD_IN_MS, readingTimings } from "../../engine/src/timing/reading.js";

describe("readingTimings", () => {
  it("times every word at a comfortable reading pace, after a short lead-in", () => {
    const { words } = readingTimings("Cats sleep sixteen hours a day");
    expect(words.map((w) => w.text)).toEqual(["Cats", "sleep", "sixteen", "hours", "a", "day"]);
    expect(words[0]!.startMs).toBe(READING_LEAD_IN_MS);
    for (const [i, w] of words.entries()) {
      expect(w.endMs).toBeGreaterThan(w.startMs);
      if (i > 0) expect(w.startMs).toBeGreaterThanOrEqual(words[i - 1]!.endMs);
    }
    const perWord = (words.at(-1)!.endMs - words[0]!.startMs) / words.length;
    expect(perWord).toBeGreaterThan(250);
    expect(perWord).toBeLessThan(600);
  });

  it("gives longer words more time", () => {
    const { words } = readingTimings("a extraordinary");
    expect(words[1]!.endMs - words[1]!.startMs).toBeGreaterThan(words[0]!.endMs - words[0]!.startMs);
  });

  it("pauses after commas and longer after sentences", () => {
    const gap = (text: string) => {
      const { words } = readingTimings(text);
      return words[1]!.startMs - words[0]!.endMs;
    };
    expect(gap("one, two")).toBeGreaterThan(gap("one two"));
    expect(gap("one. Two")).toBeGreaterThan(gap("one, two"));
  });

  it("lasts until the last word has been on screen for a moment", () => {
    const { words, durationSec } = readingTimings("Hello there.");
    expect(durationSec * 1000).toBeGreaterThan(words.at(-1)!.endMs + 500);
  });
});
