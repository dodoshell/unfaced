import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import { planFiles, stagePublicDir } from "../../engine/src/render/renderVideo.js";

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

  it("stages files dropped into inbox/ next to the soundtrack", () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced video "));
    writeFileSync(join(video, "voice.wav"), "RIFF");
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "b2.png"), "png");
    writeFileSync(join(video, "inbox", ".DS_Store"), "");

    const files = planFiles({ audioSrc: "voice.wav" } as VideoPlan, video);
    expect(files).toEqual(["voice.wav", "inbox/b2.png"]);
    const staged = stagePublicDir(video, files);
    expect(existsSync(join(staged, "inbox", "b2.png"))).toBe(true);
  });

  it("leaves out inbox folders, unknown types and the prompts list instead of failing", () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced video "));
    mkdirSync(join(video, "inbox", "raw"), { recursive: true });
    writeFileSync(join(video, "inbox", "raw", "big.png"), "png");
    writeFileSync(join(video, "inbox", "PROMPTS.md"), "## b2.png\nA cat.\n");
    writeFileSync(join(video, "inbox", "take.mov"), "mov");
    writeFileSync(join(video, "inbox", "b2.PNG"), "png");
    writeFileSync(join(video, "inbox", "clip.mp4"), "mp4");

    const files = planFiles({} as VideoPlan, video);
    expect(files).toEqual(["inbox/b2.PNG", "inbox/clip.mp4"]);
    expect(() => stagePublicDir(video, files)).not.toThrow();
  });

  it("stages nothing for a silent video without an inbox", () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced video "));
    expect(planFiles({} as VideoPlan, video)).toEqual([]);
    expect(readdirSync(stagePublicDir(video, []))).toEqual([]);
  });
});

describe("stagePublicDir outside the staged folder", () => {
  it("refuses a file whose public path would land outside the staged folder", () => {
    const source = join(mkdtempSync(join(tmpdir(), "unfaced src ")), "a.png");
    writeFileSync(source, "png");
    expect(() => stagePublicDir(tmpdir(), [], { "../escape.png": source })).toThrow(/outside the render's public folder/);
    expect(() => stagePublicDir(tmpdir(), [], { "fonts/../../escape.png": source })).toThrow(/outside the render's public folder/);
  });
});
