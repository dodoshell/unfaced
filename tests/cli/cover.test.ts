import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { coverFrame, makeCover } from "../../engine/src/cli/cover.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";

const example = join(import.meta.dirname, "..", "..", "examples", "pages", "curious-cats", "videos", "why-cats-purr");

function setup(): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced cover "));
  copyFileSync(join(example, "plan.json"), join(dir, "plan.json"));
  return dir;
}

const plan = (hookFrames: number): VideoPlan => ({
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 300,
  style: 3,
  captions: 1,
  palette: [],
  scenes: [
    { beatId: "hook", kind: "title", text: "Hi", fromFrame: 0, durationInFrames: hookFrames, words: [] },
    { beatId: "ending", kind: "outro", text: "Bye", fromFrame: hookFrames, durationInFrames: 300 - hookFrames, words: [] },
  ],
});

describe("unfaced cover", () => {
  it("picks a frame one second into the hook, or the hook's last frame when it is shorter", () => {
    expect(coverFrame(plan(90))).toBe(30);
    expect(coverFrame(plan(20))).toBe(19);
  });

  it("uses the time it is given, kept inside the video", () => {
    expect(coverFrame(plan(90), 2.5)).toBe(75);
    expect(coverFrame(plan(90), 60)).toBe(299);
  });

  it("renders cover.png from the video's plan without captions, with its own scenes", async () => {
    const dir = setup();
    mkdirSync(join(dir, "scenes"));
    writeFileSync(join(dir, "scenes", "index.tsx"), "export default {};");
    const render = vi.fn(async () => {});
    const file = await makeCover(dir, undefined, render);
    expect(file).toBe(join(dir, "cover.png"));
    const [stillPlan, frame, out, options] = render.mock.calls[0] as unknown as [VideoPlan, number, string, object];
    expect(stillPlan.scenes.flatMap((s) => s.words)).toEqual([]);
    expect(frame).toBe(30);
    expect(out).toBe(join(dir, "cover.png"));
    expect(options).toEqual({ assetsDir: dir, scenes: join(dir, "scenes", "index.tsx") });
  });

  it("asks for make when the video has not been made", async () => {
    await expect(makeCover(mkdtempSync(join(tmpdir(), "unfaced cover ")))).rejects.toThrow(/plan\.json not found.*unfaced make/);
  });
});
