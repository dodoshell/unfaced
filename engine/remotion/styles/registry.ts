import type React from "react";
import type { Rect } from "../core/safeZone.js";
import type { Scene } from "../../src/plan/types.js";
import type { FigureProps } from "../core/character/svg.js";

/** A rectangle a style draws text in, named so checks can report it. */
export interface TextBox extends Rect {
  id: string;
}

/** Everything a visual style provides to the composition. */
export interface StyleKit {
  id: number;
  defaultPalette: string[];
  /** Where the style puts text for a scene; pure, so checks can run without rendering. */
  layout(scene: Scene, palette: string[]): TextBox[];
  SceneView: React.FC<{ scene: Scene; palette: string[] }>;
  Background: React.FC<{ palette: string[] }>;
  /** Paints a character's parts (the mascot, the dog in the style demo); see core/character. */
  Figure: React.FC<FigureProps>;
}

const styles = new Map<number, StyleKit>();

export function registerStyle(kit: StyleKit): void {
  styles.set(kit.id, kit);
}

export function getStyle(id: number): StyleKit {
  const kit = styles.get(id);
  if (!kit) {
    const ready = [...styles.keys()].join(", ") || "none";
    throw new Error(`Style ${id} has no components yet; styles with components: ${ready}`);
  }
  return kit;
}
