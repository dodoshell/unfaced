import { describe, expect, it } from "vitest";
import { setVideoScenes, videoScene } from "../../engine/remotion/core/videoScenes.js";

const file = "C:/pages/cats/videos/first/scenes/index.tsx";

describe("a video's own scenes", () => {
  it("says what to export, and from which file, when scenes/index.tsx has no default export", () => {
    for (const scenes of [undefined, null, () => null]) {
      expect(() => setVideoScenes(scenes as never, file)).toThrow(/scenes\/index\.tsx .*export default defineScenes\(\{/);
    }
  });

  it("gives a beat's own scene, or none", () => {
    const Scene = () => null;
    setVideoScenes({ b2: Scene }, file);
    try {
      expect(videoScene("b2")).toBe(Scene);
      expect(videoScene("b1")).toBeUndefined();
    } finally {
      setVideoScenes({}, file);
    }
  });
});
