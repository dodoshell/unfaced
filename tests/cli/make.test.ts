import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { type MakeDeps, makeVideo } from "../../engine/src/cli/make.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import type { VoiceProvider } from "../../engine/src/voice/types.js";

const SCRIPT = `---
title: Cats
script_type: 9
hook: 1
ending: 5
---

## Hook
Why do cats purr?

## Body
Cats sleep a lot.

## Ending
That's cats.
`;

/** A page folder (with spaces and an accent in its path) holding one video. */
function setup(): string {
  const root = mkdtempSync(join(tmpdir(), "unfaced make "));
  const page = join(root, "my cat page è");
  const video = join(page, "videos", "first video");
  mkdirSync(video, { recursive: true });
  writeFileSync(join(page, "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 1\ncaptions: 1\nmusic: 8\n");
  writeFileSync(join(video, "script.md"), SCRIPT);
  return video;
}

function stubs() {
  const synthesize = vi.fn<VoiceProvider["synthesize"]>(async (text, { outPath }) => {
    writeFileSync(outPath, "RIFF");
    return { wavPath: outPath, durationSec: text.split(" ").length * 0.4, provider: "stub" };
  });
  const voice: VoiceProvider = { id: "stub", isFree: true, available: () => true, synthesize };
  const align = vi.fn<MakeDeps["align"]>(async () =>
    "Why do cats purr? Cats sleep a lot. That's cats.".split(" ").map((text, i) => ({ text, startMs: 100 + i * 400, endMs: 450 + i * 400 })),
  );
  const render = vi.fn<MakeDeps["render"]>(async (_plan, outPath) => writeFileSync(outPath, "mp4"));
  const check = vi.fn<MakeDeps["check"]>(async () => ({ pass: false, issues: [{ check: "clipping", atMs: 0, severity: "error", message: "True peak is -0.4 dBTP" }] }));
  const prepareVoice = vi.fn<MakeDeps["prepareVoice"]>(async () => {});
  const mixMusic = vi.fn<MakeDeps["mixMusic"]>(async (dir) => {
    writeFileSync(join(dir, "soundtrack.wav"), "RIFF");
    return "soundtrack.wav";
  });
  const deps: MakeDeps = { catalog: Catalog.load(CATALOG_DIR), voiceProvider: () => voice, prepareVoice, align, mixMusic, render, check, env: {}, log: () => {} };
  return { deps, voice, synthesize, prepareVoice, align, mixMusic, render, check };
}

describe("make", () => {
  it("runs voice, timing, plan and render, writing every file into the video folder", async () => {
    const video = setup();
    const { deps, render } = stubs();
    await makeVideo(video, deps);
    for (const file of ["voice.wav", "timing.json", "plan.json", "video.mp4"]) expect(existsSync(join(video, file)), file).toBe(true);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(plan).toMatchObject({ style: 3, captions: 1, audioSrc: "voice.wav" });
    expect(plan.scenes.map((s) => s.beatId)).toEqual(["hook", "b1", "ending"]);
    expect(render).toHaveBeenCalledWith(expect.anything(), join(video, "video.mp4"), { assetsDir: video });
  });

  it("puts the page's mascot and the script's ending into the plan", async () => {
    const video = setup();
    const page = join(video, "..", "..");
    mkdirSync(join(page, "brand", "mascot"), { recursive: true });
    writeFileSync(join(page, "brand", "mascot", "mascot.json"), JSON.stringify({ name: "Miso", species: "cat" }));
    await makeVideo(video, stubs().deps);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(plan.mascot).toMatchObject({ name: "Miso", rig: { species: "cat" } });
    expect(plan.ending).toBe(5);
  });

  it("bundles the video's own scene code when it has a scenes/ folder", async () => {
    const video = setup();
    mkdirSync(join(video, "scenes"));
    writeFileSync(join(video, "scenes", "index.tsx"), "export default {};");
    const { deps, render } = stubs();
    await makeVideo(video, deps);
    expect(render).toHaveBeenCalledWith(expect.anything(), join(video, "video.mp4"), { assetsDir: video, scenes: join(video, "scenes", "index.tsx") });
  });

  it("prepares the voice-over (lead-in and loudness) before timing it", async () => {
    const video = setup();
    const { deps, synthesize, prepareVoice, align } = stubs();
    await makeVideo(video, deps);
    expect(prepareVoice).toHaveBeenCalledWith(join(video, "voice.wav"));
    expect(prepareVoice.mock.invocationCallOrder[0]).toBeGreaterThan(synthesize.mock.invocationCallOrder[0]!);
    expect(prepareVoice.mock.invocationCallOrder[0]).toBeLessThan(align.mock.invocationCallOrder[0]!);
  });

  it("runs the automatic checks on the finished video and logs their summary", async () => {
    const video = setup();
    const { deps, render, check } = stubs();
    const log = vi.fn();
    await makeVideo(video, { ...deps, log });
    expect(check).toHaveBeenCalledWith(video);
    expect(check.mock.invocationCallOrder[0]).toBeGreaterThan(render.mock.invocationCallOrder[0]!);
    expect(log.mock.calls.flat()).toEqual(expect.arrayContaining(["Checks: FAIL (1 error, 0 warnings)", expect.stringContaining("clipping")]));
  });

  it("reuses the voice and timings when the spoken text has not changed", async () => {
    const video = setup();
    const { deps, synthesize, align, render } = stubs();
    await makeVideo(video, deps);
    await makeVideo(video, deps);
    expect(synthesize).toHaveBeenCalledOnce();
    expect(align).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("makes the voice and timings again after one word changes", async () => {
    const video = setup();
    const { deps, synthesize, align } = stubs();
    await makeVideo(video, deps);
    writeFileSync(join(video, "script.md"), SCRIPT.replace("a lot", "all day"));
    await makeVideo(video, deps);
    expect(synthesize).toHaveBeenCalledTimes(2);
    expect(align).toHaveBeenCalledTimes(2);
  });

  it("records the voice again when the speaker behind the voice type changes", async () => {
    const video = setup();
    const { deps, voice, synthesize } = stubs();
    voice.describeVoice = () => ({ id: "speaker-a@1" });
    await makeVideo(video, deps);
    voice.describeVoice = () => ({ id: "speaker-b@1" });
    await makeVideo(video, deps);
    expect(synthesize).toHaveBeenCalledTimes(2);
  });

  it("says when the voice only approximates the page's voice type", async () => {
    const video = setup();
    const { deps, voice } = stubs();
    voice.describeVoice = () => ({ id: "x@1", note: "The free voice has few Italian speakers" });
    const log = vi.fn();
    await makeVideo(video, { ...deps, log });
    expect(log.mock.calls.flat()).toContain("The free voice has few Italian speakers");
  });

  it("makes a text-only video for voice 8: no voice-over, captions timed at reading pace", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 8\ncaptions: 1\nmusic: 8\n");
    const { deps, synthesize, prepareVoice, align, render } = stubs();
    await makeVideo(video, deps);
    expect(synthesize).not.toHaveBeenCalled();
    expect(prepareVoice).not.toHaveBeenCalled();
    expect(align).not.toHaveBeenCalled();
    expect(existsSync(join(video, "voice.wav"))).toBe(false);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(plan.voice).toBe(8);
    expect(plan.audioSrc).toBeUndefined();
    expect(plan.scenes.flatMap((s) => s.words).map((w) => w.text).join(" ")).toBe("Why do cats purr? Cats sleep a lot. That's cats.");
    expect(render).toHaveBeenCalledOnce();
  });

  it("mixes the page's music under the voice into soundtrack.wav", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 1\ncaptions: 1\nmusic: 4\n");
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(mixMusic).toHaveBeenCalledWith(video, 4, plan.durationInFrames / 30, join(video, "voice.wav"));
    expect(plan).toMatchObject({ audioSrc: "soundtrack.wav", music: 4 });
  });

  it("makes a music-only soundtrack for a text-only video", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 8\ncaptions: 2\nmusic: 3\n");
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(mixMusic).toHaveBeenCalledWith(video, 3, plan.durationInFrames / 30, undefined);
    expect(plan.audioSrc).toBe("soundtrack.wav");
  });

  it("uses the voice-over as the soundtrack when the page has no music", async () => {
    const video = setup();
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    expect(mixMusic).not.toHaveBeenCalled();
    expect((JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan).audioSrc).toBe("voice.wav");
  });

  it("explains what is missing when the video folder has no script", async () => {
    const video = setup();
    const { deps } = stubs();
    await expect(makeVideo(join(video, "..", "nope"), deps)).rejects.toThrow(/script\.md not found/);
  });

  it("refuses a fixed choice that is not ready yet, before recording any voice", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 1\ncaptions: 2\n");
    const { deps, synthesize } = stubs();
    // A catalog where captions 2 is still planned.
    const catalogDir = mkdtempSync(join(tmpdir(), "unfaced catalog "));
    const raw = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
    raw.captions.find((e: { num: number }) => e.num === 2).status = "planned";
    writeFileSync(join(catalogDir, "catalog.json"), JSON.stringify(raw));
    await expect(makeVideo(video, { ...deps, catalog: Catalog.load(catalogDir) })).rejects.toThrow(/captions 2 .*is not ready yet.*unfaced list captions/);
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("picks the first ready option when the page leaves a choice to the agent", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: auto\nvoice: [1, 2]\n");
    const { deps } = stubs();
    const log = vi.fn();
    await makeVideo(video, { ...deps, log });
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(plan.style).toBe(3);
    expect(log.mock.calls.flat().join("\n")).toMatch(/style.*auto.*3/i);
  });
});
