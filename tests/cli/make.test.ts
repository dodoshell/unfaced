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
  writeFileSync(join(page, "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 1\ncaptions: 1\n");
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
  const normalize = vi.fn<MakeDeps["normalize"]>(async () => {});
  const deps: MakeDeps = { catalog: Catalog.load(CATALOG_DIR), voiceProvider: () => voice, normalize, align, render, check, env: {}, log: () => {} };
  return { deps, synthesize, normalize, align, render, check };
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

  it("brings the voice-over to the target loudness before timing it", async () => {
    const video = setup();
    const { deps, synthesize, normalize, align } = stubs();
    await makeVideo(video, deps);
    expect(normalize).toHaveBeenCalledWith(join(video, "voice.wav"));
    expect(normalize.mock.invocationCallOrder[0]).toBeGreaterThan(synthesize.mock.invocationCallOrder[0]!);
    expect(normalize.mock.invocationCallOrder[0]).toBeLessThan(align.mock.invocationCallOrder[0]!);
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

  it("explains what is missing when the video folder has no script", async () => {
    const video = setup();
    const { deps } = stubs();
    await expect(makeVideo(join(video, "..", "nope"), deps)).rejects.toThrow(/script\.md not found/);
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
