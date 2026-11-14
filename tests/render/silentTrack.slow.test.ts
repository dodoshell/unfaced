import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import { renderVideo } from "../../engine/src/render/renderVideo.js";

// A text-only video without music has no soundtrack; platforms and players expect an audio track all the same.
describe.skipIf(!process.env.UNFACED_SLOW)("a video with no soundtrack (slow)", () => {
  it("still gets an AAC track, silent", async () => {
    const plan: VideoPlan = {
      fps: 30,
      width: 1080,
      height: 1920,
      durationInFrames: 30,
      style: 3,
      captions: 1,
      voice: 8,
      palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
      scenes: [{ beatId: "hook", kind: "title", text: "Quiet", fromFrame: 0, durationInFrames: 30, words: [] }],
    };
    const out = join(mkdtempSync(join(tmpdir(), "unfaced silent ")), "video.mp4");
    await renderVideo(plan, out);
    const { stderr } = await runFfmpeg(["-i", out, "-map", "0", "-c", "copy", "-f", "null", "-"]);
    expect(stderr).toMatch(/Audio: aac/);
  }, 180_000);
});
