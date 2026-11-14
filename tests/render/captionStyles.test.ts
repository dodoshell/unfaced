import { describe, expect, it } from "vitest";
import { CAPTION_STYLES, captionColours, captionPages, captionStyle, fitCaptionSize, keywordIndex } from "../../engine/remotion/core/captionLayout.js";
import { isInsideSafeZone } from "../../engine/remotion/core/safeZone.js";
import { placedBoxes } from "../../engine/src/check/overlap.js";
import { shownWords } from "../../engine/src/check/sync.js";
import type { Scene, VideoPlan } from "../../engine/src/plan/types.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";

const words = (text: string) => text.split(" ").map((t, i) => ({ text: t, startMs: i * 300, endMs: i * 300 + 250 }));
const scene: Scene = { beatId: "b1", kind: "fact", text: "", fromFrame: 0, durationInFrames: 90, words: words("one two three four five six seven eight") };
const plan = (captions: number): VideoPlan => ({ fps: 30, width: 1080, height: 1920, durationInFrames: 90, style: 3, captions, palette: [], scenes: [scene] });

describe("caption styles", () => {
  it("has a renderer for every caption style in the catalog, each inside the safe zone", () => {
    const catalog = Catalog.load(CATALOG_DIR);
    expect(Object.keys(CAPTION_STYLES).map(Number).sort()).toEqual(catalog.ids("captions"));
    for (const [n, style] of Object.entries(CAPTION_STYLES)) expect(isInsideSafeZone(style.box), `captions ${n}`).toBe(true);
  });

  it("keeps white caption text on a dark ink, even when the palette's ink is light like chalk", () => {
    expect(captionColours(["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"]).ink).toBe("#1B1B3A");
    // Chalkboard: the ink is chalk white, so the board's dark green carries the white text.
    expect(captionColours(["#26392F", "#F4D774", "#F2A6B0", "#9DD1E3", "#F1EEE4"]).ink).toBe("#26392F");
    expect(captionColours(["#FFFFFF", "#FFEEDD", "#EEFFEE", "#FFFFEE", "#F1EEE4"]).ink).toBe("#000000");
    expect(captionColours([]).ink).toBe("#000000");
  });

  it("keeps a caption's type at its size while it fits the box", () => {
    expect(fitCaptionSize(["one", "two", "three"], 880, 140, 46, 1.25)).toBe(46);
  });

  it("makes the type smaller until every line fits the box's height, not only its width", () => {
    // Eight 12-letter words: at 46 px they wrap onto 4 lines, 230 px in a 140 px lower third; 37 px holds 3 lines.
    const long = Array.from({ length: 8 }, () => "aaaaaaaaaaaa");
    expect(fitCaptionSize(long, 880, 140, 46, 1.25)).toBe(37);
  });

  it("makes the type smaller until the longest word fits the width", () => {
    expect(fitCaptionSize(["Supercalifragilistic"], 880, 330, 76, 1.15)).toBe(73);
    expect(fitCaptionSize(["SUPERCALIFRAGILISTIC"], 880, 360, 104, 1.02, true)).toBe(62);
  });

  it("splits phrases to the style's word limit", () => {
    expect(captionPages([scene], 30, captionStyle(2).maxWords).map((p) => p.tokens.length)).toEqual([3, 3, 2]);
    expect(captionPages([scene], 30, captionStyle(4).maxWords).map((p) => p.tokens.length)).toEqual([8]);
  });

  it("leaves out the hook's words, which the title scene already shows, in the captions, the sync check and the overlap check", () => {
    const hook: Scene = { ...scene, beatId: "hook", kind: "title", words: words("why do cats purr") };
    const later = { ...scene, fromFrame: 90, words: scene.words.map((w) => ({ ...w, startMs: w.startMs + 3000, endMs: w.endMs + 3000 })) };
    const both = { ...plan(1), durationInFrames: 180, scenes: [hook, later] };
    expect(captionPages(both.scenes, 30).flatMap((p) => p.tokens.map((t) => t.text.trim()))).toEqual(later.words.map((w) => w.text));
    expect(shownWords(both).map((w) => w.text)).toEqual(later.words.map((w) => w.text));
    expect(placedBoxes(both, () => []).map((b) => b.id)).toEqual(["b1 caption"]);
  });

  it("checks overlap against the box of the video's caption style", () => {
    const box = placedBoxes(plan(4), () => []).find((b) => b.id === "b1 caption");
    expect(box).toMatchObject(captionStyle(4).box);
  });

  it("checks sync against the words as the caption style shows them", () => {
    expect(shownWords(plan(2)).map((w) => w.fromMs)).toEqual(words("one two three four five six seven eight").map((w) => w.startMs));
  });

  it("rejects an unknown caption style", () => {
    expect(() => captionStyle(9)).toThrow(/captions 9/);
  });

  it("picks the longest word of a phrase as its keyword, ignoring punctuation, the last on a tie", () => {
    expect(keywordIndex(["Cats", "purr", "at", "twenty-five", "hertz."])).toBe(3);
    expect(keywordIndex(["Wow!"])).toBe(0);
    expect(keywordIndex(["that's", "only", "half", "the", "story."])).toBe(4);
  });
});
