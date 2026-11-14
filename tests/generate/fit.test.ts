import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { beforeAll, describe, expect, it } from "vitest";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";
import { fitPortrait } from "../../engine/src/generate/fit.js";
import { probeMedia } from "../../engine/src/inbox/inbox.js";

describe("fitPortrait", () => {
  const dir = mkdtempSync(join(tmpdir(), "unfaced fit "));
  const at = (name: string) => join(dir, name);

  beforeAll(async () => {
    writeFileSync(at("wide.png"), PNG.sync.write(Object.assign(new PNG({ width: 1344, height: 768 }), { data: Buffer.alloc(1344 * 768 * 4, 180) })));
    const voice = join(import.meta.dirname, "..", "fixtures", "audio", "hello.wav");
    await runFfmpeg(["-loop", "1", "-i", at("wide.png"), "-i", voice, "-t", "0.4", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-y", at("wide.mp4")]);
  }, 60_000);

  it.each([
    ["png", "png"],
    ["jpg", "mjpeg"],
    ["jpeg", "mjpeg"],
  ])("fills and crops an image to 1080×1920 as .%s", async (ext, codec) => {
    await fitPortrait(at("wide.png"), at(`out.${ext}`));
    expect((await probeMedia(at(`out.${ext}`))).video).toEqual({ codec, width: 1080, height: 1920 });
  }, 30_000);

  it("fills and crops a clip to 1080×1920 H.264, without its sound", async () => {
    expect((await probeMedia(at("wide.mp4"))).audio).toEqual({ codec: "aac" });
    await fitPortrait(at("wide.mp4"), at("out.mp4"));
    const probe = await probeMedia(at("out.mp4"));
    expect(probe.video).toEqual({ codec: "h264", width: 1080, height: 1920 });
    expect(probe.audio).toBeUndefined();
  }, 60_000);
});
