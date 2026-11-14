import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { beforeAll, describe, expect, it } from "vitest";
import { checkInbox, inboxKind, parseProbe, parsePrompts } from "../../engine/src/inbox/inbox.js";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";

describe("inbox prompts", () => {
  it("reads one wanted file per heading, with the text under it as the prompt", () => {
    const md = "# Prompts\n\nIntro line.\n\n## kneading.png\nFor beat b2.\nA ginger cat kneading a blanket.\n\n## clip-1.mp4\nA slow pan over a sleeping cat.\n";
    expect(parsePrompts(md)).toEqual([
      { file: "kneading.png", prompt: "For beat b2.\nA ginger cat kneading a blanket." },
      { file: "clip-1.mp4", prompt: "A slow pan over a sleeping cat." },
    ]);
  });

  it("takes the file name from a heading written as code", () => {
    expect(parsePrompts("## `cat.png`\nA cat.\n")).toEqual([{ file: "cat.png", prompt: "A cat." }]);
  });
});

describe("inbox file kinds", () => {
  it("knows images, clips and voice by extension, in any case", () => {
    expect(inboxKind("a.PNG")).toBe("image");
    expect(inboxKind("a.jpeg")).toBe("image");
    expect(inboxKind("a.webp")).toBe("image");
    expect(inboxKind("a.mp4")).toBe("clip");
    expect(inboxKind("a.wav")).toBe("voice");
    expect(inboxKind("a.mp3")).toBe("voice");
    expect(inboxKind("a.mov")).toBeUndefined();
  });
});

describe("reading ffmpeg's description of a file", () => {
  it("finds the video codec and size, and an audio stream", () => {
    const stderr = [
      "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'clip.mp4':",
      "  Duration: 00:00:02.00, start: 0.000000, bitrate: 120 kb/s",
      "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1080x1920 [SAR 1:1 DAR 9:16], 116 kb/s, 30 fps",
      "  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 2 kb/s",
    ].join("\n");
    expect(parseProbe(stderr)).toEqual({ video: { codec: "h264", width: 1080, height: 1920 }, audio: { codec: "aac" }, durationSec: 2 });
  });

  it("reads a still image as a video stream without a duration", () => {
    const stderr = "Input #0, png_pipe, from 'a.png':\n  Duration: N/A, bitrate: N/A\n  Stream #0:0: Video: png, rgb24(pc), 800x600, 25 fps, 25 tbr, 25 tbn";
    expect(parseProbe(stderr)).toEqual({ video: { codec: "png", width: 800, height: 600 }, durationSec: undefined });
  });
});

describe("checking an inbox", () => {
  const dir = mkdtempSync(join(tmpdir(), "unfaced inbox "));
  const inbox = join(dir, "inbox");
  const at = (name: string) => join(inbox, name);

  beforeAll(async () => {
    mkdirSync(join(inbox, "raw"), { recursive: true });
    // Remotion's ffmpeg has no test sources, so the stills are drawn with pngjs and the rest made from them.
    const still = (file: string, width: number, height: number) => writeFileSync(file, PNG.sync.write(Object.assign(new PNG({ width, height }), { data: Buffer.alloc(width * height * 4, 200) })));
    still(at("tall.png"), 1080, 1920);
    still(join(dir, "wide.png"), 1920, 1080);
    still(join(dir, "small.png"), 800, 600);
    await runFfmpeg(["-i", join(dir, "small.png"), "-y", at("small.jpg")]);
    const clip = (from: string, to: string) => runFfmpeg(["-loop", "1", "-i", from, "-t", "0.4", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", to]);
    await clip(at("tall.png"), at("tall.mp4"));
    await clip(join(dir, "wide.png"), at("wide.mp4"));
    copyFileSync(join(import.meta.dirname, "..", "fixtures", "audio", "hello.wav"), at("my-voice.wav"));
    writeFileSync(at("broken.png"), "not an image");
    writeFileSync(at("notes.mov"), "");
    writeFileSync(at(".DS_Store"), "");
    writeFileSync(at("PROMPTS.md"), "## tall.png\nA red sky.\n\n## sunset.png\nA sunset over the sea.\n");
    writeFileSync(at("CREDITS.md"), "# Credits\n\n- tall.png: Photo by Jane Doe on Pexels\n");
  }, 60_000);

  it("gives one line per file and per prompt still waiting for its file", async () => {
    const lines = await checkInbox(dir);
    const byFile = Object.fromEntries(lines.map((l) => [l.file, l]));
    expect(byFile["tall.png"]).toMatchObject({ status: "ok" });
    expect(byFile["tall.png"]!.detail).toMatch(/1080×1920/);
    expect(byFile["small.jpg"]).toMatchObject({ status: "problem" });
    expect(byFile["small.jpg"]!.detail).toMatch(/800×600.*9:16.*1080/);
    expect(byFile["tall.mp4"]).toMatchObject({ status: "ok" });
    expect(byFile["wide.mp4"]).toMatchObject({ status: "problem" });
    expect(byFile["wide.mp4"]!.detail).toMatch(/1920×1080.*9:16/);
    expect(byFile["my-voice.wav"]).toMatchObject({ status: "ok" });
    expect(byFile["broken.png"]).toMatchObject({ status: "problem" });
    expect(byFile["broken.png"]!.detail).toMatch(/can't be read/);
    expect(byFile["notes.mov"]).toMatchObject({ status: "problem" });
    expect(byFile["notes.mov"]!.detail).toMatch(/unknown type/);
    expect(byFile[".DS_Store"]).toMatchObject({ status: "ignored" });
    expect(byFile["raw/"]).toMatchObject({ status: "ignored" });
    expect(byFile["sunset.png"]).toMatchObject({ status: "waiting" });
    expect(byFile["sunset.png"]!.detail).toMatch(/PROMPTS\.md/);
    expect(byFile["PROMPTS.md"]).toBeUndefined();
    expect(byFile["CREDITS.md"]).toBeUndefined();
  }, 60_000);

  it("reports a missing inbox as nothing to check", async () => {
    expect(await checkInbox(mkdtempSync(join(tmpdir(), "unfaced no inbox ")))).toEqual([]);
  });
});
