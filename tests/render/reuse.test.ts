// Rendering dozens of stills (review frames, the style demo's frames) should pay for webpack and
// for reading the composition once, not once per folder or per frame.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { closeRenders, renderStillOf } from "../../engine/src/render/renderVideo.js";

vi.mock("@remotion/bundler", () => ({ bundle: vi.fn(async () => "http://bundle") }));
vi.mock("@remotion/renderer", () => ({
  openBrowser: vi.fn(async () => ({ close: vi.fn(async () => {}) })),
  selectComposition: vi.fn(async ({ id }: { id: string }) => ({ id, width: 1080, height: 1920, fps: 30, durationInFrames: 60 })),
  renderStill: vi.fn(async () => ({})),
  renderMedia: vi.fn(async () => ({})),
}));

afterEach(async () => {
  await closeRenders();
  vi.clearAllMocks();
});

describe("reusing work across renders", () => {
  it("bundles once for jobs with no files of their own, whichever folder each writes to", async () => {
    const out = mkdtempSync(join(tmpdir(), "unfaced reuse "));
    for (const style of ["01-soft-3d", "02-90s-low-poly", "03-flat-cartoon"]) {
      await renderStillOf({ id: "DogDemo", inputProps: { style }, outPath: join(out, style, "frame-000.png"), frame: 0 });
    }
    expect(bundle).toHaveBeenCalledTimes(1);
  });

  it("reads a composition once for every frame of the same video, and again for another video", async () => {
    const out = mkdtempSync(join(tmpdir(), "unfaced reuse "));
    const still = (inputProps: Record<string, unknown>, frame: number) => renderStillOf({ id: "Video", inputProps, outPath: join(out, `f${frame}.png`), frame });
    for (const frame of [0, 30, 60, 90]) await still({ plan: { title: "a" } }, frame);
    expect(selectComposition).toHaveBeenCalledTimes(1);
    await still({ plan: { title: "b" } }, 0);
    expect(selectComposition).toHaveBeenCalledTimes(2);
  });
});
