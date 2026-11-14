import { describe, expect, it } from "vitest";
import { CAPTION_BOX } from "../../engine/remotion/core/captionLayout.js";
import { SAFE_ZONE, isInsideSafeZone } from "../../engine/remotion/core/safeZone.js";

describe("safe zone", () => {
  it("keeps clear of the platform UI on every side", () => {
    expect(SAFE_ZONE).toEqual({ top: 220, bottom: 380, left: 60, right: 140 });
  });

  it("accepts a box well inside", () => {
    expect(isInsideSafeZone({ x: 100, y: 400, w: 800, h: 200 })).toBe(true);
  });

  it("rejects a box touching the bottom 380 px", () => {
    expect(isInsideSafeZone({ x: 100, y: 1400, w: 800, h: 141 })).toBe(false);
    expect(isInsideSafeZone({ x: 100, y: 1400, w: 800, h: 140 })).toBe(true);
  });

  it("rejects a box touching the right 140 px", () => {
    expect(isInsideSafeZone({ x: 100, y: 400, w: 841, h: 200 })).toBe(false);
    expect(isInsideSafeZone({ x: 100, y: 400, w: 840, h: 200 })).toBe(true);
  });

  it("rejects boxes over the top or left edge", () => {
    expect(isInsideSafeZone({ x: 100, y: 219, w: 100, h: 100 })).toBe(false);
    expect(isInsideSafeZone({ x: 59, y: 400, w: 100, h: 100 })).toBe(false);
  });

  it("places the captions inside the safe zone", () => {
    expect(isInsideSafeZone(CAPTION_BOX)).toBe(true);
  });
});
