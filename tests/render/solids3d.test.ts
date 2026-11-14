import { describe, expect, it } from "vitest";
import type { Part } from "../../engine/remotion/core/character/types.js";
import { buildSolids, disposeSolids, type Look3D } from "../../engine/remotion/core/three/solids.js";

const look: Look3D = { segments: 12, flatShading: false, roughness: 0.6, depth: 1, light: { ambient: 0.5, key: 1, fill: 0.3 } };
const parts = [
  { kind: "ellipse", role: "body", cx: 0, cy: 0, rx: 20, ry: 12, rotate: 0, fill: "#8B5A2B" },
  { kind: "ellipse", role: "shadow", cx: 0, cy: 30, rx: 22, ry: 4, rotate: 0, fill: "#000000" },
  { kind: "capsule", role: "leg", x1: 0, y1: 10, x2: 0, y2: 30, r: 4, fill: "#8B5A2B" },
  { kind: "shape", role: "ear", points: [[0, 0], [10, 0], [5, -12]], fill: "#5A3A1B" },
  { kind: "stroke", role: "tail", points: [[20, 0], [30, -8], [36, -20]], width: 3, colour: "#5A3A1B" },
  { kind: "mark", role: "mark", text: "!", x: 0, y: -40, size: 12, colour: "#000000" },
] as unknown as Part[];

describe("3D solids", () => {
  it("makes one solid per part except the marks, which stay HTML", () => {
    expect(buildSolids(parts, look)).toHaveLength(5);
  });

  it("frees every geometry and material of a frame's solids, so a long render does not pile them up", () => {
    const solids = buildSolids(parts, look);
    let freed = 0;
    for (const s of solids) {
      s.geometry.addEventListener("dispose", () => freed++);
      s.material.addEventListener("dispose", () => freed++);
    }
    disposeSolids(solids);
    expect(freed).toBe(solids.length * 2);
  });
});
