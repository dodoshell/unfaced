import { describe, expect, it } from "vitest";
import { CATCH_FRAME, DEMO, dogDemoAt, mouthAt } from "../../engine/remotion/demo/demoMotion.js";
import { FIGURE_BOX } from "../../engine/remotion/core/character/types.js";

const frames = Array.from({ length: DEMO.durationInFrames }, (_, f) => f);
const dogHalfWidth = (FIGURE_BOX.right * DEMO.dogSize) / 100;

describe("the dog demo", () => {
  it("starts with the dog off the left edge and ends with it near the centre", () => {
    expect(dogDemoAt(0).dogX + dogHalfWidth).toBeLessThan(0);
    expect(Math.abs(dogDemoAt(DEMO.durationInFrames - 1).dogX - 540)).toBeLessThan(160);
  });

  it("has the ball meet the dog's mouth at the catch", () => {
    const state = dogDemoAt(CATCH_FRAME - 1);
    const mouth = mouthAt(CATCH_FRAME - 1);
    expect(Math.hypot(state.ballX - mouth.x, state.ballY - mouth.y)).toBeLessThan(40);
    const caught = dogDemoAt(CATCH_FRAME);
    expect(Math.hypot(caught.ballX - mouthAt(CATCH_FRAME).x, caught.ballY - mouthAt(CATCH_FRAME).y)).toBeLessThan(12);
  });

  it("is caught from the catch frame on, never before", () => {
    expect(frames.filter((f) => dogDemoAt(f).caught)[0]).toBe(CATCH_FRAME);
    expect(frames.every((f) => dogDemoAt(f).caught === f >= CATCH_FRAME)).toBe(true);
  });

  it("catches the ball in the air, near the top of the jump", () => {
    const lifts = frames.map((f) => dogDemoAt(f).dogLift);
    expect(dogDemoAt(CATCH_FRAME).dogLift).toBeGreaterThan(0.9 * Math.max(...lifts));
  });

  it("keeps the dog on the grass at the first and last frames", () => {
    expect(dogDemoAt(0).dogLift).toBe(0);
    expect(dogDemoAt(DEMO.durationInFrames - 1).dogLift).toBe(0);
  });

  it("goes run, jump, happy, idle, in that order", () => {
    const order = frames.map((f) => dogDemoAt(f).pose).filter((p, i, all) => i === 0 || all[i - 1] !== p);
    expect(order).toEqual(["run", "jump", "happy", "idle"]);
  });

  it("keeps the ball on screen from the throw on, and inside the frame vertically", () => {
    for (const f of frames.filter((f) => dogDemoAt(f).ballX < 1080 + DEMO.ballRadius)) {
      const { ballY } = dogDemoAt(f);
      expect(ballY, `frame ${f}`).toBeGreaterThan(DEMO.ballRadius);
      expect(ballY, `frame ${f}`).toBeLessThan(DEMO.groundY);
    }
  });
});
