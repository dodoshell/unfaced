import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkOverlap, checkSafeZone, type PlacedBox, placedBoxes } from "../../engine/src/check/overlap.js";
import type { Scene, VideoPlan } from "../../engine/src/plan/types.js";
import { getLayout } from "../../engine/remotion/styles/layouts.js";

const box = (id: string, x: number, y: number, w: number, h: number, fromFrame: number, toFrame: number): PlacedBox => ({ id, x, y, w, h, fromFrame, toFrame });

const scene = (beatId: string, fromFrame: number, words: Scene["words"]): Scene => ({ beatId, kind: "fact", text: "Cats sleep a lot.", fromFrame, durationInFrames: 30, words });

const plan = (scenes: Scene[]): VideoPlan => ({ fps: 30, width: 1080, height: 1920, durationInFrames: 60, style: 3, captions: 1, palette: [], audioSrc: "voice.wav", scenes });

describe("text box checks", () => {
  it("reports one overlap error for two boxes that share space and frames", () => {
    const issues = checkOverlap([box("title", 100, 500, 600, 300, 0, 60), box("caption", 100, 700, 600, 300, 30, 90)], 30);
    expect(issues).toEqual([{ check: "overlap", atMs: 1000, severity: "error", message: expect.stringMatching(/title.*caption/) }]);
  });

  it("ignores boxes that share space at different times, or only touch at an edge", () => {
    expect(checkOverlap([box("a", 100, 500, 600, 300, 0, 30), box("b", 100, 500, 600, 300, 30, 60)], 30)).toEqual([]);
    expect(checkOverlap([box("a", 100, 500, 600, 300, 0, 30), box("b", 100, 800, 600, 300, 0, 30)], 30)).toEqual([]);
  });

  it("reports a box that leaves the safe zone", () => {
    const issues = checkSafeZone([box("fact", 40, 400, 400, 400, 30, 60), box("ok", 100, 400, 400, 400, 0, 30)], 30);
    expect(issues).toEqual([{ check: "safe-zone", atMs: 1000, severity: "error", message: expect.stringContaining("fact") }]);
  });

  it("places the style's boxes in every scene and the caption box over scenes with words", () => {
    const layout = () => [{ id: "text", x: 110, y: 500, w: 780, h: 400 }];
    const boxes = placedBoxes(plan([scene("b1", 0, [{ text: "Cats", startMs: 0, endMs: 300 }]), scene("b2", 30, [])]), layout);
    expect(boxes.map((b) => [b.id, b.fromFrame, b.toFrame])).toEqual([
      ["b1 text", 0, 30],
      ["b1 caption", 0, 30],
      ["b2 text", 30, 60],
    ]);
  });

  it("finds no overlap and nothing outside the safe zone in the example videos", () => {
    for (const name of ["why-cats-purr", "cats-and-milk"]) {
      const file = join(import.meta.dirname, "..", "..", "examples", "pages", "curious-cats", "videos", name, "plan.json");
      const example = JSON.parse(readFileSync(file, "utf8")) as VideoPlan;
      const boxes = placedBoxes(example, getLayout(example.style));
      expect([...checkOverlap(boxes, 30), ...checkSafeZone(boxes, 30)], name).toEqual([]);
    }
  });
});
