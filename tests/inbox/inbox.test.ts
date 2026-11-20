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

  it("reads a WebP image's size from its header, since the engine's ffmpeg can't decode WebP", async () => {
    const riff = (chunk: string, body: Buffer) => Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.from(chunk), Buffer.alloc(4), body]);
    const lossy = (w: number, h: number) => {
      const body = Buffer.alloc(10);
      body.set([0x9d, 0x01, 0x2a], 3);
      body.writeUInt16LE(w, 6);
      body.writeUInt16LE(h, 8);
      return riff("VP8 ", body);
    };
    const lossless = (w: number, h: number) => {
      const body = Buffer.alloc(5);
      body[0] = 0x2f;
      body.writeUInt32LE((w - 1) | ((h - 1) << 14), 1);
      return riff("VP8L", body);
    };
    const extended = (w: number, h: number) => {
      const body = Buffer.alloc(10);
      body.writeUIntLE(w - 1, 4, 3);
      body.writeUIntLE(h - 1, 7, 3);
      return riff("VP8X", body);
    };
    const webp = join(mkdtempSync(join(tmpdir(), "unfaced webp ")), "inbox");
    mkdirSync(webp);
    writeFileSync(join(webp, "lossy.webp"), lossy(1080, 1920));
    writeFileSync(join(webp, "lossless.webp"), lossless(1080, 1920));
    writeFileSync(join(webp, "extended.webp"), extended(1440, 2560));
    writeFileSync(join(webp, "square.webp"), lossless(1000, 1000));
    writeFileSync(join(webp, "fake.webp"), "not an image");
    const byFile = Object.fromEntries((await checkInbox(join(webp, ".."))).map((l) => [l.file, l]));
    expect(byFile["lossy.webp"]).toMatchObject({ status: "ok", detail: "image 1080×1920" });
    expect(byFile["lossless.webp"]).toMatchObject({ status: "ok", detail: "image 1080×1920" });
    expect(byFile["extended.webp"]).toMatchObject({ status: "ok", detail: "image 1440×2560" });
    expect(byFile["square.webp"]).toMatchObject({ status: "problem" });
    expect(byFile["square.webp"]!.detail).toMatch(/1000×1000.*9:16/);
    expect(byFile["fake.webp"]).toMatchObject({ status: "problem" });
  });

  it("reports a missing inbox as nothing to check", async () => {
    expect(await checkInbox(mkdtempSync(join(tmpdir(), "unfaced no inbox ")))).toEqual([]);
  });
});

describe("checking a post's inbox", () => {
  const post = (front: string) => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced post inbox "));
    mkdirSync(join(dir, "inbox"), { recursive: true });
    writeFileSync(join(dir, "slides.md"), `---\ntitle: T\npost_type: 1\n${front}---\n\n## cover\n# Hi\n`);
    for (const f of ["shop.jpg", "tall.png", "clip.mp4", "voice.wav"]) writeFileSync(join(dir, "inbox", f), "");
    writeFileSync(join(dir, "inbox", "PROMPTS.md"), "## later.png\nFor slide 3. A door.\n");
    return dir;
  };
  const sized = (width: number, height: number) => async (path: string) =>
    path.endsWith(".png") ? { video: { codec: "png", width: 1080, height: 1920 }, durationSec: undefined } : { video: { codec: "mjpeg", width, height }, durationSec: undefined };

  it("accepts images at the format's shape and reports clips and voice as ignored", async () => {
    const lines = await checkInbox(post("format: instagram-carousel\n"), sized(1080, 1350));
    const byFile = Object.fromEntries(lines.map((l) => [l.file, l]));
    expect(byFile["shop.jpg"]).toMatchObject({ status: "ok", detail: "image 1080×1350" });
    expect(byFile["tall.png"]).toMatchObject({ status: "problem" });
    expect(byFile["tall.png"]!.detail).toMatch(/1080×1350/);
    expect(byFile["clip.mp4"]).toEqual({ file: "clip.mp4", status: "ignored", detail: "posts use images only" });
    expect(byFile["voice.wav"]).toEqual({ file: "voice.wav", status: "ignored", detail: "posts use images only" });
    expect(byFile["later.png"]).toMatchObject({ status: "waiting" });
  });

  it("wants a story's photos at 9:16 and a square post's at 1:1", async () => {
    const story = Object.fromEntries((await checkInbox(post("format: story\n"), sized(1080, 1920))).map((l) => [l.file, l]));
    expect(story["shop.jpg"]).toMatchObject({ status: "ok" });
    const square = Object.fromEntries((await checkInbox(post("format: instagram-post\nsquare: true\n"), sized(1080, 1080))).map((l) => [l.file, l]));
    expect(square["shop.jpg"]).toMatchObject({ status: "ok", detail: "image 1080×1080" });
  });
});

describe("a post's format when slides.md names none", () => {
  const bare = (pageYaml: string | undefined) => {
    const page = mkdtempSync(join(tmpdir(), "unfaced post page "));
    const dir = join(page, "posts", "p");
    mkdirSync(join(dir, "inbox"), { recursive: true });
    if (pageYaml !== undefined) writeFileSync(join(page, "page.yaml"), pageYaml);
    writeFileSync(join(dir, "slides.md"), "---\ntitle: T\npost_type: 1\n---\n\n## cover\n# Hi\n");
    writeFileSync(join(dir, "inbox", "shop.jpg"), "");
    return dir;
  };
  const at = (width: number, height: number) => async () => ({ video: { codec: "mjpeg", width, height }, durationSec: undefined });

  it("uses the page's first format", async () => {
    const dir = bare("name: T\nformats: [story, instagram-carousel]\n");
    expect((await checkInbox(dir, at(1080, 1920)))[0]).toMatchObject({ status: "ok", detail: "image 1080×1920" });
    expect((await checkInbox(dir, at(1080, 1350)))[0]).toMatchObject({ status: "problem" });
  });

  it.each([["no page.yaml", undefined], ["an invalid page.yaml", "name: [unclosed\n"]])("falls back to instagram-carousel with %s", async (_n, yaml) => {
    const dir = bare(yaml);
    expect((await checkInbox(dir, at(1080, 1350)))[0]).toMatchObject({ status: "ok", detail: "image 1080×1350" });
    expect((await checkInbox(dir, at(1080, 1920)))[0]).toMatchObject({ status: "problem" });
  });
});
