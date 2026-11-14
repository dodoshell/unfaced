import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { CheckReport } from "../../engine/src/check/types.js";
import { tones } from "../audio/tones.js";
import { type CheckDeps, checkVideo, summaryLines } from "../../engine/src/cli/check.js";

const example = join(import.meta.dirname, "..", "..", "examples", "pages", "curious-cats", "videos", "cats-and-milk");

/** A made video folder: the example's plan, and a stand-in video.mp4. */
function setup(): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced check è "));
  for (const file of ["plan.json"]) copyFileSync(join(example, file), join(dir, file));
  writeFileSync(join(dir, "video.mp4"), "mp4");
  return dir;
}

const moving = (n: number) => Array.from({ length: n }, (_, i) => new Uint8Array(64).fill(200).fill(255, i % 64, (i % 64) + 1));

const deps = (truePeakDb: number): CheckDeps => ({
  readFrames: async () => moving(30),
  measureLoudness: async () => ({ integratedLufs: -20, truePeakDb }),
  readSoundtrack: async () => tones(1000, []),
});

describe("check", () => {
  it("writes check.json, passing a video whose only issues are warnings", async () => {
    const dir = setup();
    const report = await checkVideo(dir, deps(-3));
    expect(report.pass).toBe(true);
    expect(report.issues.map((i) => i.check)).toEqual(["loudness"]);
    expect(JSON.parse(readFileSync(join(dir, "check.json"), "utf8"))).toEqual(report);
  });

  it("fails a video with an error", async () => {
    const report = await checkVideo(setup(), deps(0.2));
    expect(report.pass).toBe(false);
    expect(report.issues.map((i) => [i.check, i.severity])).toContainEqual(["clipping", "error"]);
  });

  it("skips the voice and loudness checks for a silent text-only video", async () => {
    const dir = setup();
    const plan = JSON.parse(readFileSync(join(dir, "plan.json"), "utf8"));
    delete plan.audioSrc;
    writeFileSync(join(dir, "plan.json"), JSON.stringify({ ...plan, voice: 8 }));
    const readSoundtrack = vi.fn(async () => tones(1000, []));
    const measureLoudness = vi.fn(async () => ({ integratedLufs: -70, truePeakDb: -70 }));
    const report = await checkVideo(dir, { ...deps(-3), readSoundtrack, measureLoudness });
    expect(readSoundtrack).not.toHaveBeenCalled();
    expect(measureLoudness).not.toHaveBeenCalled();
    expect(report).toEqual({ pass: true, issues: [] });
  });

  it("checks loudness but not the voice for a text-only video with music", async () => {
    const dir = setup();
    const plan = JSON.parse(readFileSync(join(dir, "plan.json"), "utf8"));
    writeFileSync(join(dir, "plan.json"), JSON.stringify({ ...plan, voice: 8, audioSrc: "soundtrack.wav" }));
    const readSoundtrack = vi.fn(async () => tones(1000, []));
    const report = await checkVideo(dir, { ...deps(0.5), readSoundtrack });
    expect(readSoundtrack).not.toHaveBeenCalled();
    expect(report.issues.map((i) => i.check)).toContain("clipping");
  });

  it("checks the text boxes that the video's own scenes declare in scenes/boxes.json", async () => {
    const dir = setup();
    mkdirSync(join(dir, "scenes"));
    writeFileSync(join(dir, "scenes", "boxes.json"), JSON.stringify({ b1: [{ id: "label", x: 60, y: 1250, w: 900, h: 200 }] }));
    const report = await checkVideo(dir, deps(-3));
    expect(report.issues.filter((i) => i.check === "overlap").map((i) => i.message)).toEqual([expect.stringMatching(/b1 label.*b1 caption/)]);
    writeFileSync(join(dir, "scenes", "boxes.json"), JSON.stringify({ hook: [{ id: "label", x: 60 }] }));
    await expect(checkVideo(dir, deps(-3))).rejects.toThrow(/scenes\/boxes\.json.*hook.*x, y, w and h/);
  });

  it("asks for make when the video folder has not been made", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced check "));
    await expect(checkVideo(dir, deps(-3))).rejects.toThrow(/unfaced make/);
  });

  it("summarises a report as a verdict and one line per issue with its time", () => {
    const report: CheckReport = {
      pass: false,
      issues: [
        { check: "clipping", atMs: 0, severity: "error", message: "True peak is -0.4 dBTP" },
        { check: "sync", atMs: 12_345, severity: "error", message: "Captions drift 3 frames" },
      ],
    };
    expect(summaryLines(report)).toEqual(["Checks: FAIL (2 errors, 0 warnings)", "  error   0:00.0  clipping  True peak is -0.4 dBTP", "  error   0:12.3  sync  Captions drift 3 frames"]);
    expect(summaryLines({ pass: true, issues: [] })).toEqual(["Checks: PASS (0 errors, 0 warnings)"]);
  });
});
