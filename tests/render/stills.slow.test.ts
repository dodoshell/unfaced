import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import { renderStillAt } from "../../engine/src/render/renderVideo.js";

const fixtures = join(import.meta.dirname, "..", "fixtures");
const options = { entryPoint: join(fixtures, "remotion", "entry.ts"), assetsDir: join(fixtures, "audio") };
const reference = join(fixtures, "render", "caption-reference.png");

const w = (text: string, startMs: number, endMs: number) => ({ text, startMs, endMs });

// 3 s, three scenes; the second scene's caption has an accented letter and a curly apostrophe.
const plan: VideoPlan = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 90,
  style: 3,
  captions: 1,
  palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
  audioSrc: "hello.wav",
  scenes: [
    { beatId: "hook", kind: "title", text: "Hello world", fromFrame: 0, durationInFrames: 30, words: [w("Hello", 100, 500), w("world,", 500, 1000)] },
    { beatId: "b1", kind: "fact", text: "Perché è l’acqua", fromFrame: 30, durationInFrames: 30, words: [w("Perché", 1000, 1300), w("è", 1300, 1500), w("l’acqua", 1500, 2000)] },
    { beatId: "ending", kind: "outro", text: "Bye", fromFrame: 60, durationInFrames: 30, words: [w("Bye.", 2000, 2600)] },
  ],
};

const readPng = (file: string) => PNG.sync.read(readFileSync(file));

// Bundles the composition and renders in headless Chrome. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("render stills (slow)", () => {
  const out = mkdtempSync(join(tmpdir(), "unfaced stills è "));

  it("renders the first, middle and last frame at 1080×1920", async () => {
    for (const frame of [0, 45, 89]) {
      const file = join(out, `frame-${frame}.png`);
      await renderStillAt(plan, frame, file, options);
      const png = readPng(file);
      expect([png.width, png.height], `frame ${frame}`).toEqual([1080, 1920]);
    }
  }, 600_000);

  it("draws captions with è and ’ the same as the reference still (2% tolerance)", async () => {
    const file = join(out, "caption.png");
    await renderStillAt(plan, 50, file, options); // 1.67 s: "Perché è l’acqua", "l’acqua" highlighted
    expect(existsSync(reference), `missing ${reference}; render it, check it by eye, then commit it`).toBe(true);
    const actual = readPng(file);
    const expected = readPng(reference);
    const diff = pixelmatch(actual.data, expected.data, null, 1080, 1920, { threshold: 0.1 });
    expect(diff / (1080 * 1920)).toBeLessThan(0.02);
  }, 600_000);
});
