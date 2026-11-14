import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stagePublicDir } from "../../engine/src/render/renderVideo.js";

describe("stagePublicDir", () => {
  it("gives the render only the voice-over, not the rest of the video folder", () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced video è "));
    writeFileSync(join(video, "voice.wav"), "RIFF");
    writeFileSync(join(video, "video.mp4"), "a big old render");
    mkdirSync(join(video, "frames"));
    writeFileSync(join(video, "frames", "frame-00000.png"), "png");

    const staged = stagePublicDir(video, "voice.wav");
    expect(readdirSync(staged)).toEqual(["voice.wav"]);
    expect(staged.startsWith(tmpdir())).toBe(true);
    expect(existsSync(join(video, "voice.wav"))).toBe(true);
  });
});
