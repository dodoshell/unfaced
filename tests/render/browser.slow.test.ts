import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { describe, expect, it, vi } from "vitest";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import { closeRenders, renderStillAt } from "../../engine/src/render/renderVideo.js";

vi.mock("@remotion/renderer", async (importOriginal) => {
  const real = await importOriginal<typeof import("@remotion/renderer")>();
  return { ...real, openBrowser: vi.fn(real.openBrowser), selectComposition: vi.fn(real.selectComposition), renderStill: vi.fn(real.renderStill) };
});

const plan: VideoPlan = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 60,
  style: 3,
  captions: 1,
  voice: 8,
  palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
  scenes: [{ beatId: "hook", kind: "title", text: "One browser", fromFrame: 0, durationInFrames: 60, words: [] }],
};

// Starting Chrome takes about a second; review frames are rendered one at a time, often dozens of them.
describe.skipIf(!process.env.UNFACED_SLOW)("rendering several stills (slow)", () => {
  it("starts the browser once and closes it with the bundle", async () => {
    const out = mkdtempSync(join(tmpdir(), "unfaced browser "));
    for (const frame of [0, 20, 40]) await renderStillAt(plan, frame, join(out, `frame-${frame}.png`));
    expect(openBrowser).toHaveBeenCalledTimes(1);
    const browser = await vi.mocked(openBrowser).mock.results[0]!.value;
    for (const [options] of vi.mocked(selectComposition).mock.calls) expect(options.puppeteerInstance).toBe(browser);
    for (const [options] of vi.mocked(renderStill).mock.calls) expect(options.puppeteerInstance).toBe(browser);
    await closeRenders();
    await renderStillAt(plan, 0, join(out, "again.png"));
    await closeRenders();
    expect(openBrowser).toHaveBeenCalledTimes(2);
  }, 300_000);
});
