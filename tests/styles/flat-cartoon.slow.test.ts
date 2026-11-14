import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterAll, describe, expect, it } from "vitest";
import { layout } from "../../catalog/styles/03-flat-cartoon/components/layout.js";
import { CAPTION_BOX } from "../../engine/remotion/core/captionLayout.js";
import { isInsideSafeZone, type Rect } from "../../engine/remotion/core/safeZone.js";
import type { Scene, VideoPlan } from "../../engine/src/plan/types.js";
import { closeRenders, renderStillAt } from "../../engine/src/render/renderVideo.js";

const palette = ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"];
const w = (text: string, startMs: number) => ({ text, startMs, endMs: startMs + 300 });

const scenes: Scene[] = [
  { beatId: "hook", kind: "title", text: "Why do cats purr when nobody is around to hear it?", fromFrame: 0, durationInFrames: 60, words: [w("Why", 100), w("do", 400), w("cats", 700), w("purr?", 1000)] },
  { beatId: "b2", kind: "fact", text: "Cats sleep up to sixteen hours a day.", fromFrame: 60, durationInFrames: 60, words: [w("Cats", 2000), w("sleep", 2300), w("a", 2600), w("lot.", 2900)] },
  { beatId: "b3", kind: "list", text: "Three things cats hate:\n- water\n- loud noises\n- closed doors\n- being ignored by their humans all day long", fromFrame: 120, durationInFrames: 60, words: [w("Three", 4000), w("things", 4300), w("cats", 4600), w("hate:", 4900)] },
  { beatId: "ending", kind: "outro", text: "That's cats.", fromFrame: 180, durationInFrames: 60, words: [w("That's", 6000), w("cats.", 6300)] },
];

const plan: VideoPlan = { fps: 30, width: 1080, height: 1920, durationInFrames: 240, style: 3, captions: 1, palette, audioSrc: "hello.wav", scenes };

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("style 03 flat cartoon layout", () => {
  it.each(scenes)("keeps the $kind text inside the safe zone and clear of the captions", (scene) => {
    const boxes = layout(scene, palette);
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(isInsideSafeZone(box), `${scene.kind} ${box.id}`).toBe(true);
      expect(overlaps(box, CAPTION_BOX), `${scene.kind} ${box.id} vs captions`).toBe(false);
    }
  });

  it("does not let list items overlap each other", () => {
    const boxes = layout(scenes[2]!, palette);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!), `${boxes[i]!.id} vs ${boxes[j]!.id}`).toBe(false);
    }
  });
});

// Renders through the engine's own entry point. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("style 03 flat cartoon stills (slow)", () => {
  const out = mkdtempSync(join(tmpdir(), "unfaced flat cartoon "));
  const assetsDir = join(import.meta.dirname, "..", "fixtures", "audio");
  afterAll(() => closeRenders());

  it.each(scenes)("renders a $kind scene that is not one flat colour", async (scene) => {
    const file = join(out, `${scene.kind}.png`);
    await renderStillAt(plan, scene.fromFrame + 40, file, { assetsDir });
    const png = PNG.sync.read(readFileSync(file));
    const luma: number[] = [];
    for (let i = 0; i < png.data.length; i += 4 * 97) luma.push(0.299 * png.data[i]! + 0.587 * png.data[i + 1]! + 0.114 * png.data[i + 2]!);
    const mean = luma.reduce((a, b) => a + b, 0) / luma.length;
    const variance = luma.reduce((a, b) => a + (b - mean) ** 2, 0) / luma.length;
    console.log(`${scene.kind}: ${file} (variance ${variance.toFixed(0)})`);
    expect(variance).toBeGreaterThan(200);
  }, 600_000);
});
