import { describe, expect, it } from "vitest";
import { CAPTION_STYLES } from "../../engine/remotion/core/captionLayout.js";
import { END_MARK_BOX, endingMark, endingMarkSpan, LOOP_FADE_FRAMES, tailFrames } from "../../engine/remotion/core/endings.js";
import { isInsideSafeZone } from "../../engine/remotion/core/safeZone.js";
import type { Scene, VideoPlan } from "../../engine/src/plan/types.js";

const scene = (beatId: string, fromFrame: number, durationInFrames: number): Scene => ({ beatId, kind: "fact", text: "x", fromFrame, durationInFrames, words: [] });
const plan = (ending: number): VideoPlan => ({
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 120,
  style: 3,
  captions: 1,
  palette: [],
  ending,
  scenes: [scene("hook", 0, 40), scene("b1", 40, 50), scene("ending", 90, 30)],
});

describe("endings", () => {
  it("gives a sign to the endings that ask the viewer to do something next", () => {
    expect([1, 2, 3, 4, 5, 6].map(endingMark)).toEqual([undefined, "continued", "comment", "follow", undefined, "callback"]);
    expect(endingMark(undefined)).toBeUndefined();
  });

  it("keeps the sign's box inside the safe zone and clear of every caption style", () => {
    expect(isInsideSafeZone(END_MARK_BOX)).toBe(true);
    for (const style of Object.values(CAPTION_STYLES)) expect(END_MARK_BOX.y + END_MARK_BOX.h).toBeLessThan(style.box.y);
  });

  it("shows the sign over the whole last scene", () => {
    expect(endingMarkSpan(plan(3))).toEqual({ fromFrame: 90, toFrame: 120 });
    expect(endingMarkSpan(plan(5))).toBeUndefined();
  });

  it("cuts a seamless loop back to the start sooner than other endings", () => {
    expect(tailFrames(1)).toBeLessThan(tailFrames(5));
    expect(tailFrames(undefined)).toBe(tailFrames(5));
    expect(LOOP_FADE_FRAMES).toBeGreaterThan(0);
    expect(LOOP_FADE_FRAMES).toBeLessThanOrEqual(15);
  });
});
