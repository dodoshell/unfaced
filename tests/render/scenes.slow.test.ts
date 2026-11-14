import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterAll, describe, expect, it } from "vitest";
import type { VideoPlan } from "../../engine/src/plan/types.js";
import { closeRenders, renderStillAt } from "../../engine/src/render/renderVideo.js";

const plan: VideoPlan = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 60,
  style: 3,
  captions: 1,
  palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
  scenes: [
    { beatId: "hook", kind: "title", text: "A dog", fromFrame: 0, durationInFrames: 30, words: [] },
    { beatId: "ending", kind: "outro", text: "Bye", fromFrame: 30, durationInFrames: 30, words: [] },
  ],
};

// A video's own scene, in a page folder outside the library: it imports the kit and Remotion by name.
const SCENE = `import { AbsoluteFill } from "remotion";
import { Character, defineScenes, rigFor } from "@unfaced/kit";

const Hook = () => (
  <AbsoluteFill style={{ backgroundColor: "#FF0000" }}>
    <Character rig={rigFor("dog")} pose="run" x={540} y={1100} size={500} />
  </AbsoluteFill>
);

export default defineScenes({ hook: Hook });
`;

const pixel = (png: PNG, x: number, y: number) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 3)];

// Bundles a video's scenes/ folder with the engine and renders in headless Chrome. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("a video's own scenes (slow)", () => {
  afterAll(() => closeRenders());

  it("draws the video's scene for its beat and the style's scene for the others", async () => {
    const video = join(mkdtempSync(join(tmpdir(), "unfaced page è ")), "videos", "dog");
    mkdirSync(join(video, "scenes"), { recursive: true });
    writeFileSync(join(video, "scenes", "index.tsx"), SCENE);
    const options = { assetsDir: video, scenes: join(video, "scenes", "index.tsx") };

    await renderStillAt(plan, 10, join(video, "hook.png"), options);
    await renderStillAt(plan, 40, join(video, "ending.png"), options);
    const hook = PNG.sync.read(readFileSync(join(video, "hook.png")));
    const ending = PNG.sync.read(readFileSync(join(video, "ending.png")));

    expect(pixel(hook, 20, 300)).toEqual([255, 0, 0]);
    expect(pixel(hook, 540, 1000)).not.toEqual([255, 0, 0]); // the dog
    expect(pixel(ending, 20, 300)).not.toEqual([255, 0, 0]);
  }, 180_000);
});
