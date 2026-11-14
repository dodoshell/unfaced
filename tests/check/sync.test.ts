import { describe, expect, it } from "vitest";
import { captionedOnsets, checkEdges, checkSync, shownWords } from "../../engine/src/check/sync.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import type { WordTiming } from "../../engine/src/timing/align.js";
import { tones } from "../audio/tones.js";

const words: WordTiming[] = "Cats sleep sixteen hours daily.".split(" ").map((text, i) => ({ text, startMs: 500 + i * 300, endMs: 750 + i * 300 }));
const shown = (frames: number) => words.map((w) => ({ text: w.text, fromMs: w.startMs + (frames * 1000) / 30 }));
/** The voice starts speaking at 500 ms and again at 1400 ms. */
const onsets = [500, 1400];

describe("caption sync against the voice", () => {
  it("passes captions that light a word when the voice starts it", () => {
    expect(checkSync(shown(0), onsets, 30)).toEqual([]);
  });

  it("reports captions 3 frames late at each place the voice starts after a pause", () => {
    expect(checkSync(shown(3), onsets, 30)).toEqual([
      { check: "sync", atMs: 500, severity: "error", message: expect.stringMatching(/3 frames behind the voice at "Cats"/) },
      { check: "sync", atMs: 1400, severity: "error", message: expect.stringMatching(/3 frames behind the voice at "hours"/) },
    ]);
  });

  it("accepts a drift of 2 frames, early or late", () => {
    expect(checkSync(shown(2), onsets, 30)).toEqual([]);
    expect(checkSync(shown(-2), onsets, 30)).toEqual([]);
  });

  it("reads the words the captions light up from the plan, scene by scene", () => {
    const plan: VideoPlan = {
      fps: 30, width: 1080, height: 1920, durationInFrames: 120, style: 3, captions: 1, palette: [], audioSrc: "voice.wav",
      scenes: [
        { beatId: "b1", kind: "fact", text: "Cats sleep", fromFrame: 0, durationInFrames: 30, words: words.slice(0, 2) },
        { beatId: "b2", kind: "fact", text: "sixteen hours daily.", fromFrame: 30, durationInFrames: 90, words: words.slice(2) },
      ],
    };
    expect(shownWords(plan)).toEqual(shown(0));
  });

  it("checks only where captions are shown: not during the title, which already shows the hook", () => {
    const plan: VideoPlan = {
      fps: 30, width: 1080, height: 1920, durationInFrames: 120, style: 3, captions: 1, palette: [], audioSrc: "voice.wav",
      scenes: [
        { beatId: "hook", kind: "title", text: "Cats sleep", fromFrame: 0, durationInFrames: 30, words: words.slice(0, 2) },
        { beatId: "b1", kind: "fact", text: "sixteen hours daily.", fromFrame: 30, durationInFrames: 90, words: words.slice(2) },
      ],
    };
    expect(captionedOnsets(plan, [500, 980, 1100, 3900, 4100])).toEqual([1100, 3900]);
  });
});

describe("cut words", () => {
  it("passes a soundtrack with quiet at both ends", () => {
    expect(checkEdges(tones(3000, [[250, 2400]]))).toEqual([]);
  });

  it("reports speech in the first 80 ms", () => {
    expect(checkEdges(tones(3000, [[50, 2400]]))).toEqual([{ check: "cut-word", atMs: 0, severity: "error", message: expect.stringContaining("first word") }]);
  });

  it("reports speech in the last 80 ms", () => {
    expect(checkEdges(tones(3000, [[250, 2960]]))).toEqual([{ check: "cut-word", atMs: 2920, severity: "error", message: expect.stringContaining("last word") }]);
  });
});
