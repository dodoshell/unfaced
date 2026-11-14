import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterAll, describe, expect, it } from "vitest";
import { characterParts, partBounds } from "../../engine/remotion/core/character/parts.js";
import { DEMO, DOG, dogDemoAt } from "../../engine/remotion/demo/demoMotion.js";
import { DOG_DEMO_ID } from "../../engine/remotion/compositionId.js";
import { closeRenders, renderStillOf } from "../../engine/src/render/renderVideo.js";

/** Share of the middle of the dog's body (its "body" part, placed as the demo places it) painted brown. */
function brownShare(png: PNG, frame: number): number {
  const state = dogDemoAt(frame);
  const body = characterParts(DOG, state.pose, state.poseFrame, DEMO.fps).find((p) => p.role === "body")!;
  const box = partBounds(body);
  const k = DEMO.dogSize / 100;
  const [cx, cy] = [state.dogX + ((box.left + box.right) / 2) * k, DEMO.groundY - state.dogLift + ((box.top + box.bottom) / 2) * k];
  const [hw, hh] = [((box.right - box.left) / 2) * k * 0.6, ((box.bottom - box.top) / 2) * k * 0.6];
  const [x0, x1, y0, y1] = [cx - hw, cx + hw, cy - hh, cy + hh];
  let brown = 0;
  let all = 0;
  for (let y = Math.round(y0); y < y1; y += 4) {
    for (let x = Math.max(0, Math.round(x0)); x < Math.min(png.width, x1); x += 4) {
      const i = (y * png.width + x) * 4;
      const [r, g, b] = [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
      all++;
      if (r > g && g > b && r - b > 70) brown++;
    }
  }
  return brown / all;
}

// Renders the dog demo in the soft 3D style in headless Chrome (WebGL). Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("3D figures (slow)", () => {
  const out = mkdtempSync(join(tmpdir(), "unfaced 3d "));
  afterAll(() => closeRenders());

  it.each([86, 140])("paints the dog's body where the shared character system puts it (frame %i)", async (frame) => {
    const file = join(out, `frame-${frame}.png`);
    await renderStillOf({ id: DOG_DEMO_ID, inputProps: { style: 1 }, outPath: file, frame });
    const share = brownShare(PNG.sync.read(readFileSync(file)), frame);
    console.log(`frame ${frame}: ${file} (${(share * 100).toFixed(0)}% brown)`);
    expect(share).toBeGreaterThan(0.6);
  }, 600_000);
});
