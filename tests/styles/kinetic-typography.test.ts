import { describe, expect, it } from "vitest";
import { beatAt, CAP, fitLines, keyword, listReveal, stackHeight, stageBeats, stageText, textWidth } from "../../catalog/styles/12-kinetic-typography/components/kinetic.js";
import { layout } from "../../catalog/styles/12-kinetic-typography/components/layout.js";
import type { Scene } from "../../engine/src/plan/types.js";

const FPS = 30;
/** Words said one after another from `startMs`, 300 ms apart. */
const said = (text: string, startMs: number) => text.split(" ").map((w, i) => ({ text: w, startMs: startMs + i * 300, endMs: startMs + i * 300 + 250 }));
const scene = (kind: Scene["kind"], text: string, words = said(text, 2000)): Scene => ({ beatId: "b1", kind, text, fromFrame: 60, durationInFrames: 150, words });

describe("style 12 type setting", () => {
  it("measures Anton capitals from the font's own widths", () => {
    expect(textWidth("CATS")).toBeCloseTo(0.474 + 0.485 + 0.396 + 0.461, 3);
    expect(textWidth("cats")).toBe(textWidth("CATS"));
    expect(textWidth("WW")).toBeGreaterThan(textWidth("II") * 2);
  });

  it("stacks a hook in big lines that fill the column, keeping every word in order and fitting the box", () => {
    const box = layout(scene("title", "Why do cats purr?"), [])[0]!;
    for (const hook of ["Why do cats purr?", "Why does your cat press its paws into your soft blanket every single night like it is making bread for you?"]) {
      const lines = fitLines(hook, box, { maxLines: 7, maxSize: 400, fill: 0.96 });
      expect(lines.map((l) => l.text).join(" ")).toBe(hook);
      expect(stackHeight(lines)).toBeLessThanOrEqual(box.h);
      for (const l of lines) expect(l.width).toBeLessThanOrEqual(box.w);
      expect(Math.min(...lines.map((l) => l.size)), hook).toBeGreaterThanOrEqual(90);
    }
    const short = fitLines("Why do cats purr?", box, { maxLines: 7, maxSize: 400, fill: 0.96 });
    expect(short.length).toBe(3);
  });

  it("sets a single key word on one line, as big as the stage allows", () => {
    const stage = layout(scene("fact", "x"), [])[1]!;
    const [line] = fitLines("EVERYONE", stage, { maxLines: 1, maxSize: 720 });
    expect(line!.width).toBeGreaterThan(stage.w * 0.98);
    const [short] = fitLines("IT", stage, { maxLines: 1, maxSize: 720 });
    expect(short!.size * CAP).toBeLessThanOrEqual(stage.h);
  });
});

describe("style 12 key words", () => {
  it("picks the phrase's longest word that isn't a small word, favouring the last one", () => {
    const pick = (phrase: string) => phrase.split(" ")[keyword(phrase.split(" "))];
    expect(pick("Because they're happy.")).toBe("happy.");
    expect(pick("Everyone knows that.")).toBe("Everyone");
    expect(pick("and even while giving birth.")).toBe("birth.");
    expect(pick("Some scientists even think the")).toBe("scientists");
    expect(pick("Actually,")).toBe("Actually,");
    expect(pick("it is what it is")).toBe("what");
  });

  it("shows the word in capitals without the punctuation round it, keeping a question or an exclamation", () => {
    expect(stageText("happy.")).toBe("HAPPY");
    expect(stageText("“purr?”")).toBe("PURR?");
    expect(stageText("they're,")).toBe("THEY'RE");
    expect(stageText("wow!")).toBe("WOW!");
  });

  it("puts the key word of each caption phrase on stage, cutting when the phrase starts and hitting when it is said", () => {
    // Two phrases: "Because they're happy." from 2.0 s and "Everyone knows that." from 2.9 s; the scene starts at frame 60.
    const beats = stageBeats(scene("fact", "Because they're happy. Everyone knows that."), FPS, 5);
    expect(beats.map((b) => b.text)).toEqual(["HAPPY", "EVERYONE"]);
    expect(beats[0]).toMatchObject({ from: 0, hit: 18, to: 27, ticks: [0, 9, 18] });
    expect(beats[1]).toMatchObject({ from: 27, hit: 27, to: 150 });
    expect(beatAt(beats, 0)!.beat.text).toBe("HAPPY");
    expect(beatAt(beats, 26)!.beat.text).toBe("HAPPY");
    expect(beatAt(beats, 27)).toMatchObject({ index: 1, beat: { text: "EVERYONE" } });
  });

  it("follows the caption style's phrase length", () => {
    const text = "Cats sleep up to sixteen hours every day";
    expect(stageBeats(scene("fact", text), FPS, 5).length).toBe(2);
    expect(stageBeats(scene("fact", text), FPS, 3).length).toBe(3);
  });

  it("spreads the written words over the scene when it has no voice", () => {
    const beats = stageBeats(scene("fact", "Cats sleep a lot. Dogs do not.", []), FPS, 5);
    expect(beats.map((b) => b.text)).toEqual(["SLEEP", "DOGS"]);
    expect(beats[1]!.from).toBeGreaterThan(60);
  });
});

describe("style 12 list timing", () => {
  const text = "Cats purr when they are:\n- scared\n- hurt\n- giving birth";
  const reading = said("Cats purr when they are: scared hurt giving birth", 2000);

  it("lands each item when the voice reaches its first word", () => {
    // Words 0.3 s apart from 2.0 s, the scene's first frame (60): "scared" is word 5 (3.5 s, frame 105), "hurt" word 6, "giving" word 7.
    expect(listReveal(scene("list", text, reading), FPS)).toEqual([45, 54, 63]);
  });

  it("scales the match when the voice says more words than are written, and lands every item before the scene ends", () => {
    const spoken = said("Cats also purr when they're scared when they're hurt and even while giving birth", 2000);
    const reveal = listReveal(scene("list", text, spoken), FPS);
    expect(reveal).toEqual([...reveal].sort((a, b) => a - b));
    expect(reveal[0]).toBeGreaterThan(30);
    const late = listReveal({ ...scene("list", text, reading), durationInFrames: 50 }, FPS);
    for (const at of late) expect(at).toBeLessThanOrEqual(38);
  });
});
