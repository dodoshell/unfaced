import { describe, expect, it } from "vitest";
import { checkEdges, checkSync, shownWords } from "../../engine/src/check/sync.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import type { WordTiming } from "../../engine/src/timing/align.js";

const words: WordTiming[] = "Cats sleep sixteen hours daily.".split(" ").map((text, i) => ({ text, startMs: 500 + i * 300, endMs: 750 + i * 300 }));
const shifted = (frames: number) => words.map((w) => ({ text: w.text, fromMs: w.startMs + (frames * 1000) / 30 }));

describe("caption sync", () => {
  it("passes captions that light each word when it is spoken", () => {
    expect(checkSync(shifted(0), words, 30)).toEqual([]);
  });

  it("reports captions 3 frames late as one sync error where the drift starts", () => {
    expect(checkSync(shifted(3), words, 30)).toEqual([{ check: "sync", atMs: 500, severity: "error", message: expect.stringContaining("3 frames") }]);
  });

  it("accepts a drift of 2 frames, early or late", () => {
    expect(checkSync(shifted(2), words, 30)).toEqual([]);
    expect(checkSync(shifted(-2), words, 30)).toEqual([]);
  });

  it("reports captions that show a different number of words than the voice-over", () => {
    expect(checkSync(shifted(0).slice(1), words, 30)).toEqual([{ check: "sync", atMs: 0, severity: "error", message: expect.stringContaining("4 words") }]);
  });

  it("reads the words the captions light up from the plan, scene by scene", () => {
    const plan: VideoPlan = {
      fps: 30, width: 1080, height: 1920, durationInFrames: 120, style: 3, captions: 1, palette: [], audioSrc: "voice.wav",
      scenes: [
        { beatId: "b1", kind: "title", text: "Cats sleep", fromFrame: 0, durationInFrames: 30, words: words.slice(0, 2) },
        { beatId: "b2", kind: "fact", text: "sixteen hours daily.", fromFrame: 30, durationInFrames: 90, words: words.slice(2) },
      ],
    };
    expect(shownWords(plan)).toEqual(shifted(0));
  });
});

describe("cut words", () => {
  it("passes a voice-over with room before the first word and after the last", () => {
    expect(checkEdges(words, 3000)).toEqual([]);
  });

  it("reports a first word starting less than 80 ms into the video", () => {
    expect(checkEdges([{ text: "Cats", startMs: 50, endMs: 300 }], 3000)).toEqual([{ check: "cut-word", atMs: 50, severity: "error", message: expect.stringContaining("Cats") }]);
  });

  it("reports a last word ending less than 80 ms before the video ends", () => {
    expect(checkEdges([{ text: "daily.", startMs: 2600, endMs: 2950 }], 3000)).toEqual([{ check: "cut-word", atMs: 2600, severity: "error", message: expect.stringContaining("daily.") }]);
  });
});
