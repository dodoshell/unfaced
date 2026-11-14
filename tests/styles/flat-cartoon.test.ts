import { describe, expect, it } from "vitest";
import { factBadge, factNumber } from "../../catalog/styles/03-flat-cartoon/components/layout.js";
import type { Scene } from "../../engine/src/plan/types.js";

const scene = (beatId: string, kind: Scene["kind"]): Scene => ({ beatId, kind, text: "x", fromFrame: 0, durationInFrames: 30, words: [] });
const scenes = [scene("hook", "title"), scene("b1", "fact"), scene("b2", "list"), scene("b3", "fact"), scene("b4", "fact"), scene("ending", "outro")];
const facts = ["b1", "b3", "b4"].map((id) => scenes.find((s) => s.beatId === id)!);

describe("style 03 fact badges", () => {
  it("number the facts 1, 2, 3 in order, skipping the list scenes between them", () => {
    expect(facts.map((s) => factNumber(s, scenes))).toEqual([1, 2, 3]);
  });

  it("fall back to the beat's number without the other scenes", () => {
    expect(factNumber(scene("b3", "fact"))).toBe(3);
  });

  it("count up for script types that list facts or steps, down for a countdown, and show no number otherwise", () => {
    expect(facts.map((s) => factBadge(s, scenes, 9))).toEqual(["1", "2", "3"]);
    expect(facts.map((s) => factBadge(s, scenes, 7))).toEqual(["1", "2", "3"]);
    expect(facts.map((s) => factBadge(s, scenes, 2))).toEqual(["3", "2", "1"]);
    expect(facts.map((s) => factBadge(s, scenes, 6))).toEqual([undefined, undefined, undefined]);
  });

  it("keep numbering when the plan does not say its script type (plans made before it was recorded)", () => {
    expect(factBadge(facts[1]!, scenes, undefined)).toBe("2");
  });
});
