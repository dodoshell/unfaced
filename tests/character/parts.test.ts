import { describe, expect, it } from "vitest";
import { characterParts, partBounds } from "../../engine/remotion/core/character/parts.js";
import { rigFor, SPECIES } from "../../engine/remotion/core/character/rig.js";
import { FIGURE_BOX, POSES, type Part } from "../../engine/remotion/core/character/types.js";

const FPS = 30;
const lowest = (parts: Part[]) => Math.max(...parts.filter((p) => p.role !== "shadow" && p.role !== "mark").map((p) => partBounds(p).bottom));
const legs = (parts: Part[]) => parts.filter((p) => p.role === "leg" || p.role === "leg-far");
const arms = (parts: Part[]) => parts.filter((p) => p.role === "arm" || p.role === "arm-far");

describe("character parts", () => {
  it("gives a dog four legs and a tail, and no arms", () => {
    const parts = characterParts(rigFor("dog"), "idle", 0, FPS);
    expect(legs(parts)).toHaveLength(4);
    expect(arms(parts)).toHaveLength(0);
    expect(parts.some((p) => p.role === "tail")).toBe(true);
  });

  it("gives a person two legs and two arms", () => {
    const parts = characterParts(rigFor("person"), "idle", 0, FPS);
    expect(legs(parts)).toHaveLength(2);
    expect(arms(parts)).toHaveLength(2);
  });

  it("stands on the ground when idle", () => {
    for (const species of SPECIES) {
      expect(lowest(characterParts(rigFor(species), "idle", 0, FPS)), species).toBeCloseTo(0, 0);
    }
  });

  it("leaves the ground in the middle of a jump", () => {
    const parts = characterParts(rigFor("dog"), "jump", Math.round(0.45 * FPS), FPS);
    expect(lowest(parts)).toBeLessThan(-15);
  });

  it("stays inside its box in every pose and frame", () => {
    for (const species of SPECIES) {
      for (const pose of POSES) {
        for (const frame of [0, 7, 14, 23]) {
          for (const p of characterParts(rigFor(species), pose, frame, FPS)) {
            const b = partBounds(p);
            expect(b.left, `${species} ${pose} ${p.role}`).toBeGreaterThanOrEqual(FIGURE_BOX.left);
            expect(b.right, `${species} ${pose} ${p.role}`).toBeLessThanOrEqual(FIGURE_BOX.right);
            expect(b.top, `${species} ${pose} ${p.role}`).toBeGreaterThanOrEqual(FIGURE_BOX.top);
            expect(b.bottom, `${species} ${pose} ${p.role}`).toBeLessThanOrEqual(FIGURE_BOX.bottom);
          }
        }
      }
    }
  });

  it("moves its legs while running but not while idle", () => {
    const rig = rigFor("dog");
    const legAt = (pose: "idle" | "run", frame: number) => JSON.stringify(legs(characterParts(rig, pose, frame, FPS)));
    expect(legAt("run", 0)).not.toEqual(legAt("run", 4));
    expect(legAt("idle", 0)).toEqual(legAt("idle", 4));
  });

  it("shows each pose differently", () => {
    const rig = rigFor("cat");
    const drawn = POSES.map((pose) => JSON.stringify(characterParts(rig, pose, 9, FPS)));
    expect(new Set(drawn).size).toBe(POSES.length);
  });

  it("opens and closes the mouth while talking", () => {
    const rig = rigFor("person");
    const mouths = Array.from({ length: 12 }, (_, f) => JSON.stringify(characterParts(rig, "talk", f, FPS).find((p) => p.role === "mouth")));
    expect(new Set(mouths).size).toBeGreaterThan(2);
  });

  it("marks surprise and thinking above the head", () => {
    const rig = rigFor("cat");
    expect(characterParts(rig, "surprised", 10, FPS).find((p) => p.kind === "mark")).toMatchObject({ glyph: "!" });
    expect(characterParts(rig, "thinking", 10, FPS).find((p) => p.kind === "mark")).toMatchObject({ glyph: "?" });
    expect(characterParts(rig, "idle", 10, FPS).some((p) => p.kind === "mark")).toBe(false);
  });

  it("draws the rig's colours and accessories", () => {
    const rig = rigFor("cat", { colours: { body: "#FF8800", belly: "#FFFFFF", accent: "#222222" }, accessories: ["glasses"] });
    const parts = characterParts(rig, "idle", 0, FPS);
    expect(parts.find((p) => p.role === "body")).toMatchObject({ fill: "#FF8800" });
    expect(parts.some((p) => p.role === "accessory")).toBe(true);
  });

  it("is deterministic", () => {
    const rig = rigFor("bird");
    expect(characterParts(rig, "happy", 17, FPS)).toEqual(characterParts(rig, "happy", 17, FPS));
  });
});

describe("rigFor", () => {
  it("fills a species preset and applies overrides", () => {
    const rig = rigFor("dog", { ears: "pointy" });
    expect(rig.build).toBe("quadruped");
    expect(rig.ears).toBe("pointy");
    expect(rig.tail).not.toBe("none");
  });

  it("rejects an unknown species with the list of known ones", () => {
    expect(() => rigFor("dragon" as never)).toThrow(/cat, dog/);
  });
});
