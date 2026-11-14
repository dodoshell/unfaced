import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { beforeAll, describe, expect, it, vi } from "vitest";
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

  it.each(["png", "mp4"])("reads only the file itself: a concat list named .%s pointing at another file is refused", async (ext) => {
    writeFileSync(at(`list.${ext}`), `ffconcat version 1.0\nfile 'wide.${ext}'\n`);
    await expect(fitPortrait(at(`list.${ext}`), at(`from-list.${ext}`))).rejects.toThrow(/ffmpeg failed/);
  }, 30_000);

  it.each([
    ["png", ["-f", "image2", "-pattern_type", "none"]],
    ["jpg", ["-f", "image2", "-pattern_type", "none"]],
    ["mp4", ["-f", "mov"]],
  ])("forces the input format for .%s and lets ffmpeg open local files only", async (ext, format) => {
    const run = vi.fn<typeof runFfmpeg>(async () => ({ stdout: Buffer.alloc(0), stderr: "" }));
    await fitPortrait(at(`in.${ext}`), at(`out.${ext}`), run);
    const args = run.mock.calls[0]![0];
    const input = args.slice(0, args.indexOf("-i"));
    expect(input).toEqual(expect.arrayContaining(["-protocol_whitelist", "file"]));
    expect(input.join(" ")).toContain(format.join(" "));
  });

  it("refuses to read a type it can't force", async () => {
    const run = vi.fn<typeof runFfmpeg>();
    await expect(fitPortrait(at("in.webp"), at("out.png"), run)).rejects.toThrow("Can't read .webp files safely; use .png, .jpg or .mp4");
    expect(run).not.toHaveBeenCalled();
  });

  it("fills and crops a clip to 1080×1920 H.264, without its sound", async () => {
    expect((await probeMedia(at("wide.mp4"))).audio).toEqual({ codec: "aac" });
    await fitPortrait(at("wide.mp4"), at("out.mp4"));
    const probe = await probeMedia(at("out.mp4"));
    expect(probe.video).toEqual({ codec: "h264", width: 1080, height: 1920 });
    expect(probe.audio).toBeUndefined();
  }, 60_000);
});
