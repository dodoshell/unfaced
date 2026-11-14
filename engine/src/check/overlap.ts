import { CAPTION_BOX } from "../../remotion/core/captionLayout.js";
import { isInsideSafeZone, type Rect } from "../../remotion/core/safeZone.js";
import type { StyleKit } from "../../remotion/styles/registry.js";
import type { VideoPlan } from "../plan/types.js";
import { type CheckIssue, frameMs } from "./types.js";

/** A text box and the frames it is on screen, `toFrame` excluded. */
export interface PlacedBox extends Rect {
  id: string;
  fromFrame: number;
  toFrame: number;
}

/** Every text box the video draws: the style's boxes in each scene, plus the caption box over scenes with words. */
export function placedBoxes(plan: VideoPlan, layout: StyleKit["layout"]): PlacedBox[] {
  return plan.scenes.flatMap((scene) => {
    const frames = { fromFrame: scene.fromFrame, toFrame: scene.fromFrame + scene.durationInFrames };
    const boxes = layout(scene, plan.palette).map(({ id, ...rect }) => ({ id: `${scene.beatId} ${id}`, ...rect, ...frames }));
    if (scene.words.length > 0) boxes.push({ id: `${scene.beatId} caption`, ...CAPTION_BOX, ...frames });
    return boxes;
  });
}

const overlaps = (a: PlacedBox, b: PlacedBox): boolean =>
  a.fromFrame < b.toFrame && b.fromFrame < a.toFrame && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function checkOverlap(boxes: PlacedBox[], fps: number): CheckIssue[] {
  const issues: CheckIssue[] = [];
  boxes.forEach((a, i) => {
    for (const b of boxes.slice(i + 1)) {
      if (!overlaps(a, b)) continue;
      issues.push({ check: "overlap", atMs: frameMs(Math.max(a.fromFrame, b.fromFrame), fps), severity: "error", message: `Text boxes "${a.id}" and "${b.id}" overlap` });
    }
  });
  return issues;
}

export function checkSafeZone(boxes: PlacedBox[], fps: number): CheckIssue[] {
  return boxes
    .filter((box) => !isInsideSafeZone(box))
    .map((box): CheckIssue => ({ check: "safe-zone", atMs: frameMs(box.fromFrame, fps), severity: "error", message: `Text box "${box.id}" reaches outside the safe zone` }));
}
