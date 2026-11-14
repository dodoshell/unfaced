import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StyleScene } from "../../engine/remotion/kit/index.js";
import { VideoContext } from "../../engine/remotion/core/VideoContext.js";
import type { StyleKit } from "../../engine/remotion/styles/registry.js";
import type { Scene, VideoPlan } from "../../engine/src/plan/types.js";

const scene: Scene = { beatId: "hook", kind: "title", text: "Why do cats knead?", fromFrame: 0, durationInFrames: 60, words: [] };
const style: StyleKit = {
  id: 99,
  defaultPalette: ["#fff"],
  layout: () => [],
  Background: () => null,
  Figure: () => null,
  SceneView: ({ scene: s, palette }) => <p data-colour={palette[0]}>{`${s.kind}: ${s.text}`}</p>,
};
const plan = { style: 99, palette: ["#123456"], scenes: [scene] } as unknown as VideoPlan;

describe("StyleScene", () => {
  it("draws the style's own scene for a beat, so a video's scene can add to it", () => {
    const html = renderToStaticMarkup(
      <VideoContext.Provider value={{ plan, style, palette: plan.palette }}>
        <StyleScene scene={scene} palette={plan.palette} />
      </VideoContext.Provider>,
    );
    expect(html).toBe('<p data-colour="#123456">title: Why do cats knead?</p>');
  });
});
