import { captionStyle, showsCaptions } from "../../remotion/core/captionLayout.js";
import { END_MARK_BOX, endingMarkSpan } from "../../remotion/core/endings.js";
import { isInsideSafeZone, type Rect } from "../../remotion/core/safeZone.js";
import type { StyleKit, TextBox } from "../../remotion/styles/registry.js";
import type { VideoPlan } from "../plan/types.js";
import { type CheckIssue, frameMs } from "./types.js";

/** A text box and the frames it is on screen, `toFrame` excluded. */
export interface PlacedBox extends Rect {
  id: string;
  fromFrame: number;
  toFrame: number;
}

/** Text boxes declared by a video's own scene code (scenes/boxes.json), by beat id. */
export type OwnBoxes = Record<string, TextBox[]>;

/**
 * Every text box the video draws: the style's boxes in each scene (or the boxes the video's
 * own scenes declare for that beat), the caption box over scenes with words, and the ending's
 * sign when the engine draws it (`styleDrawsMark` false).
 */
export function placedBoxes(plan: VideoPlan, layout: StyleKit["layout"], styleDrawsMark = false, own: OwnBoxes = {}): PlacedBox[] {
  const mark = styleDrawsMark ? undefined : endingMarkSpan(plan);
  const markBox: PlacedBox[] = mark ? [{ id: "ending mark", ...END_MARK_BOX, ...mark }] : [];
  return plan.scenes.flatMap((scene) => {
    const frames = { fromFrame: scene.fromFrame, toFrame: scene.fromFrame + scene.durationInFrames };
    const boxes = (own[scene.beatId] ?? layout(scene, plan.palette)).map(({ id, ...rect }) => ({ id: `${scene.beatId} ${id}`, ...rect, ...frames }));
    if (scene.words.length > 0 && showsCaptions(scene)) boxes.push({ id: `${scene.beatId} caption`, ...captionStyle(plan.captions).box, ...frames });
    return boxes;
  }).concat(markBox);
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
