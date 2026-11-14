import type React from "react";
import type { Scene } from "../../src/plan/types.js";

/** A scene drawn by code written for one video (its `scenes/` folder), replacing the style's own. */
export type SceneComponent = React.FC<{ scene: Scene; palette: string[] }>;

let custom: Record<string, SceneComponent> = {};

/** Scenes by beat id ("hook", "b1", ..., "ending"); what a video's scenes/index.tsx exports. */
export function defineScenes(scenes: Record<string, SceneComponent>): Record<string, SceneComponent> {
  return scenes;
}

/** Called by the generated entry point of a video with a scenes/ folder; `file` is its index.tsx, named when the default export is missing. */
export function setVideoScenes(scenes: Record<string, SceneComponent>, file: string): void {
  if (!scenes || typeof scenes !== "object") {
    throw new Error(`${file} must export its scenes by default: end it with export default defineScenes({ b2: MyScene }), naming each scene by its beat ("hook", "b1", ..., "ending")`);
  }
  custom = scenes;
}

/** The video's own scene for a beat, if it has one. */
export function videoScene(beatId: string): SceneComponent | undefined {
  return custom[beatId];
}
