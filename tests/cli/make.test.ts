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
  const importVoice = vi.fn<MakeDeps["importVoice"]>(async (_src, wavPath) => {
    writeFileSync(wavPath, "RIFF");
    return 3.2;
  });
  const deps: MakeDeps = { catalog: Catalog.load(CATALOG_DIR), voiceProvider: () => voice, prepareVoice, importVoice, align, mixMusic, render, check, env: {}, log: () => {} };
  return { deps, voice, synthesize, prepareVoice, importVoice, align, mixMusic, render, check };
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

  it("stops before recording anything when scenes/ has no index.tsx", async () => {
    const video = setup();
    mkdirSync(join(video, "scenes"));
    writeFileSync(join(video, "scenes", "index.ts"), "export default {};");
    const { deps, synthesize, render } = stubs();
    await expect(makeVideo(video, deps)).rejects.toThrow(/scenes has no index\.tsx.*export default defineScenes/);
    expect(synthesize).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it("names scenes/boxes.json when it is not valid, before recording anything", async () => {
    const video = setup();
    mkdirSync(join(video, "scenes"));
    writeFileSync(join(video, "scenes", "index.tsx"), "export default {};");
    const boxes = join(video, "scenes", "boxes.json");
    const { deps, synthesize } = stubs();
    for (const text of ["{ b1: [] }", "null", "[]", '{ "b1": [{ "id": "label" }] }']) {
      writeFileSync(boxes, text);
      await expect(makeVideo(video, deps), text).rejects.toThrow(boxes);
    }
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("warns about boxes in scenes/boxes.json for beats the video does not have", async () => {
    const video = setup();
    mkdirSync(join(video, "scenes"));
    writeFileSync(join(video, "scenes", "index.tsx"), "export default {};");
    writeFileSync(join(video, "scenes", "boxes.json"), JSON.stringify({ b1: [], b7: [{ id: "label", x: 100, y: 300, w: 300, h: 100 }] }));
    const log = vi.fn();
    await makeVideo(video, { ...stubs().deps, log });
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/boxes\.json: this video has no beat "b7".*hook, b1, ending/));
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('"b1"'));
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

  it("returns the plan and the check report, so the command can fail when a check fails", async () => {
    const { deps } = stubs();
    const made = await makeVideo(setup(), deps);
    expect(made.plan.style).toBe(3);
    expect(made.report.pass).toBe(false);
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

  it("tries the page's voice again next time when another voice stood in for it", async () => {
    const video = setup();
    const { deps, synthesize } = stubs();
    synthesize.mockImplementationOnce(async (_text, { outPath }) => {
      writeFileSync(outPath, "RIFF");
      return { wavPath: outPath, durationSec: 3, provider: "kokoro" };
    });
    await makeVideo(video, deps);
    await makeVideo(video, deps);
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
    expect(mixMusic).toHaveBeenCalledWith(video, { mood: 4, durationSec: plan.durationInFrames / 30, voiceWav: join(video, "voice.wav"), loop: false });
    expect(plan).toMatchObject({ audioSrc: "soundtrack.wav", music: 4 });
  });

  it("makes a music-only soundtrack for a text-only video", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 8\ncaptions: 2\nmusic: 3\n");
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(mixMusic).toHaveBeenCalledWith(video, { mood: 3, durationSec: plan.durationInFrames / 30, loop: false });
    expect(plan.audioSrc).toBe("soundtrack.wav");
  });

  it("keeps the music going to the cut when the script ends on a seamless loop", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 1\ncaptions: 1\nmusic: 5\n");
    writeFileSync(join(video, "script.md"), SCRIPT.replace("ending: 5", "ending: 1"));
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    expect(mixMusic).toHaveBeenCalledWith(video, expect.objectContaining({ mood: 5, loop: true }));
  });

  it("uses the voice-over as the soundtrack when the page has no music", async () => {
    const video = setup();
    const { deps, mixMusic } = stubs();
    await makeVideo(video, deps);
    expect(mixMusic).not.toHaveBeenCalled();
    expect((JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan).audioSrc).toBe("voice.wav");
  });

  it("uses the script's own captions and music for this video, leaving the page as it is", async () => {
    const video = setup();
    writeFileSync(join(video, "script.md"), SCRIPT.replace("ending: 5", "ending: 5\ncaptions: 4\nmusic: 6"));
    const { deps, mixMusic } = stubs();
    const log = vi.fn();
    await makeVideo(video, { ...deps, log });
    const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
    expect(plan).toMatchObject({ captions: 4, music: 6 });
    expect(mixMusic).toHaveBeenCalledWith(video, expect.objectContaining({ mood: 6 }));
    expect(log.mock.calls.flat().join("\n")).toMatch(/captions 4 .*this video.*page.*1/i);
    expect(readFileSync(join(video, "..", "..", "page.yaml"), "utf8")).toContain("captions: 1");
  });

  it("refuses a script choice that is not ready yet", async () => {
    const video = setup();
    writeFileSync(join(video, "script.md"), SCRIPT.replace("ending: 5", "ending: 5\nstyle: 7"));
    const { deps } = stubs();
    // Style 7 stands in for a style that isn't built yet, whatever the real catalog says by now.
    deps.catalog.get("style", 7).status = "planned";
    await expect(makeVideo(video, deps)).rejects.toThrow(/style 7 .*not ready yet/);
  });

  it("refuses a script type, hook or ending that is not in the catalog, before recording any voice", async () => {
    for (const [line, kind] of [["script_type: 9", "script"], ["hook: 1", "hook"], ["ending: 5", "ending"]] as const) {
      const video = setup();
      writeFileSync(join(video, "script.md"), SCRIPT.replace(line, `${line.split(":")[0]}: 51`));
      const { deps, synthesize } = stubs();
      await expect(makeVideo(video, deps), kind).rejects.toThrow(new RegExp(`script\\.md: ${kind} 51 does not exist; choose a number from 1–`));
      expect(synthesize).not.toHaveBeenCalled();
    }
  });

  it("refuses a script whose ending is not ready yet", async () => {
    const video = setup();
    const { deps } = stubs();
    const catalogDir = mkdtempSync(join(tmpdir(), "unfaced catalog "));
    const raw = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
    raw.ending.find((e: { num: number }) => e.num === 5).status = "planned";
    writeFileSync(join(catalogDir, "catalog.json"), JSON.stringify(raw));
    await expect(makeVideo(video, { ...deps, catalog: Catalog.load(catalogDir) })).rejects.toThrow(/script\.md: ending 5 .*is not ready yet.*unfaced list ending/);
  });

  it("stops with advice when whisper hears no words, without keeping those timings", async () => {
    const video = setup();
    const { deps, align, render } = stubs();
    align.mockResolvedValueOnce([]);
    await expect(makeVideo(video, deps)).rejects.toThrow(/heard no words in .*voice\.wav/);
    expect(render).not.toHaveBeenCalled();
    expect(existsSync(join(video, "timing.json"))).toBe(false);
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
    const firstReady = Catalog.load(CATALOG_DIR).list("style").find((e) => e.status === "ready")!.num;
    expect(plan.style).toBe(firstReady);
    expect(log.mock.calls.flat().join("\n")).toMatch(new RegExp(`style.*auto.*${firstReady}`, "i"));
  });
});

describe("make with a voice-over handed off in inbox/", () => {
  it("uses inbox/voice.mp3 instead of recording one", async () => {
    const video = setup();
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "voice.mp3"), "ID3 one");
    const { deps, synthesize, importVoice, prepareVoice, align } = stubs();
    await makeVideo(video, deps);
    expect(synthesize).not.toHaveBeenCalled();
    expect(importVoice).toHaveBeenCalledWith(join(video, "inbox", "voice.mp3"), join(video, "voice.wav"));
    expect(prepareVoice).toHaveBeenCalledWith(join(video, "voice.wav"));
    expect(align).toHaveBeenCalledWith(join(video, "voice.wav"), "en");
    expect(JSON.parse(readFileSync(join(video, "timing.json"), "utf8"))).toMatchObject({ provider: "inbox/voice.mp3", durationSec: 3.2 });
    expect(JSON.parse(readFileSync(join(video, "plan.json"), "utf8"))).toMatchObject({ audioSrc: "voice.wav" });
  });

  it("reuses it while the file is unchanged, and takes it again when it changes", async () => {
    const video = setup();
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "voice.wav"), "RIFF one");
    const { deps, importVoice } = stubs();
    await makeVideo(video, deps);
    await makeVideo(video, deps);
    expect(importVoice).toHaveBeenCalledTimes(1);
    writeFileSync(join(video, "inbox", "voice.wav"), "RIFF two");
    await makeVideo(video, deps);
    expect(importVoice).toHaveBeenCalledTimes(2);
  });

  it("takes voice.wav when both are there, and says the other is not used", async () => {
    const video = setup();
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "voice.wav"), "RIFF");
    writeFileSync(join(video, "inbox", "voice.mp3"), "ID3");
    const log = vi.fn();
    const { deps, importVoice } = stubs();
    await makeVideo(video, { ...deps, log });
    expect(importVoice).toHaveBeenCalledWith(join(video, "inbox", "voice.wav"), join(video, "voice.wav"));
    expect(log.mock.calls.flat().join("\n")).toContain("inbox/voice.mp3 is not used");
  });

  it("leaves it out of a text-only video, and says so", async () => {
    const video = setup();
    writeFileSync(join(video, "..", "..", "page.yaml"), "name: My cats\nlanguage: en\nniche: cat facts\nstyle: 3\nvoice: 8\ncaptions: 1\nmusic: 8\n");
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "voice.mp3"), "ID3");
    const log = vi.fn();
    const { deps, importVoice } = stubs();
    await makeVideo(video, { ...deps, log });
    expect(importVoice).not.toHaveBeenCalled();
    expect(log.mock.calls.flat().join("\n")).toMatch(/voice 8.*text only.*inbox\/voice\.mp3 is not used/);
  });
});
