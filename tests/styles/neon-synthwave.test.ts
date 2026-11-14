import { describe, expect, it } from "vitest";
import { luminance, neon, night } from "../../catalog/styles/10-neon-synthwave/components/colours.js";
import { layout, MONOTON_MIN, titleType } from "../../catalog/styles/10-neon-synthwave/components/layout.js";
import type { Scene } from "../../engine/src/plan/types.js";

const title = (text: string): Scene => ({ beatId: "hook", kind: "title", text, fromFrame: 0, durationInFrames: 60, words: [] });
const box = (text: string) => layout(title(text), [])[0]!;

describe("style 10 title type", () => {
  it("sets a short hook in Monoton, the neon sign face, at a large size", () => {
    const type = titleType("Why do cats purr?", box("Why do cats purr?"));
    expect(type.font).toBe("display");
    expect(type.size).toBeGreaterThanOrEqual(100);
  });

  it("falls back to Orbitron when Monoton would drop below its readable size", () => {
    const hook = "Why does your cat press its paws into your soft blanket every single night like it is making bread for you?";
    const type = titleType(hook, box(hook));
    expect(type.font).toBe("text");
    expect(type.size).toBeGreaterThanOrEqual(40);
  });

  it("keeps Monoton at its readable size or above while it fits", () => {
    const type = titleType("Cats sleep sixteen hours a day", box("x"));
    expect(type.font).toBe("display");
    expect(type.size).toBeGreaterThanOrEqual(MONOTON_MIN);
  });
});

const hue = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
};

describe("style 10 neon colours", () => {
  it("lights a part in its own hue, bright enough to glow", () => {
    for (const c of ["#F29A3B", "#6B3F1F", "#3E9B4F", "#E5677A"]) {
      expect(Math.abs(hue(neon(c)) - hue(c)), c).toBeLessThan(6);
      expect(luminance(neon(c)), c).toBeGreaterThan(0.35);
    }
  });

  it("turns greys and rgba() line work into a white tube", () => {
    expect(neon("#FFFFFF")).toBe(neon("#1B1B1F"));
    expect(luminance(neon("rgba(0,0,0,0.16)"))).toBeGreaterThan(0.9);
  });

  it("fills glass with the darker of background and ink, and keeps it dark for light-only palettes", () => {
    expect(night(["#14062F", "#FF2A9D", "#22E1F0", "#FFC23D", "#08020F"])).toBe("#08020F");
    expect(night(["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"])).toBe("#1B1B3A");
    expect(luminance(night(["#FFFFFF", "#FF0055", "#22E1F0", "#FFC23D", "#EEEEEE"]))).toBeLessThan(0.25);
  });
});
