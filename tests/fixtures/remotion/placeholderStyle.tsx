import { AbsoluteFill } from "remotion";
import type { StyleKit } from "../../../engine/remotion/styles/registry.js";

// A test-only style: a flat background and the scene text in a box at the top.
export const placeholderStyle: StyleKit = {
  id: 3,
  defaultPalette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
  layout: () => [{ id: "text", x: 100, y: 300, w: 800, h: 300 }],
  Background: ({ palette }) => <AbsoluteFill style={{ backgroundColor: palette[0] }} />,
  SceneView: ({ scene, palette }) => (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 100, top: 300, width: 800, height: 300, backgroundColor: palette[2], color: palette[4], fontSize: 60, fontFamily: "sans-serif" }}>
        {scene.kind}
      </div>
    </AbsoluteFill>
  ),
};
