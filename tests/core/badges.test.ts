import { describe, expect, it } from "vitest";
import { factBadge, factNumber, listParts } from "../../engine/remotion/core/badges.js";
import type { Scene } from "../../engine/src/plan/types.js";

const scene = (beatId: string, kind: Scene["kind"]): Scene => ({ beatId, kind, text: "x", fromFrame: 0, durationInFrames: 30, words: [] });
const scenes = [scene("hook", "title"), scene("b1", "fact"), scene("b2", "list"), scene("b3", "fact"), scene("b4", "fact"), scene("ending", "outro")];
const facts = ["b1", "b3", "b4"].map((id) => scenes.find((s) => s.beatId === id)!);

describe("fact badges", () => {
  it("number the facts in order, skipping the list scenes between them", () => {
    expect(facts.map((s) => factNumber(s, scenes))).toEqual([1, 2, 3]);
    expect(factNumber(scene("b3", "fact"))).toBe(3);
  });

  it.each([
    [1, ["1", "2", "3"]],
    [7, ["1", "2", "3"]],
    [9, ["1", "2", "3"]],
    [2, ["3", "2", "1"]],
  ])("show numbers for script type %i", (type, expected) => {
    expect(facts.map((s) => factBadge(s, scenes, type))).toEqual(expected);
  });

  it.each([3, 4, 5, 6, 8, 10])("show no number for script type %i, whose beats are not a numbered list", (type) => {
    expect(facts.map((s) => factBadge(s, scenes, type))).toEqual([undefined, undefined, undefined]);
  });

  it("keep numbering when the plan does not say its script type", () => {
    expect(factBadge(facts[1]!, scenes, undefined)).toBe("2");
  });
});

describe("listParts", () => {
  it("splits a list beat into its lead-in and its items", () => {
    expect(listParts("Three things:\n- water\n-  noise \n- doors")).toEqual({ header: "Three things:", items: ["water", "noise", "doors"] });
    expect(listParts("- a\n- b")).toEqual({ header: "", items: ["a", "b"] });
  });
});
