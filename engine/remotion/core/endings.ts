// How the endings of the catalog (catalog/endings.md) show on screen. Pure, so the plan
// and the checks use the same numbers as the composition.
import type { VideoPlan } from "../../src/plan/types.js";
import type { Pose } from "./character/types.js";
import type { Rect } from "./safeZone.js";

/** Ending 01: the last line flows back into the first and the video replays without a cut. */
export const SEAMLESS_LOOP = 1;

/** The wordless sign an ending shows over the last scene, so it works in every language. */
export type EndingMarkKind = "continued" | "comment" | "follow" | "callback";

const MARKS: Partial<Record<number, EndingMarkKind>> = { 2: "continued", 3: "comment", 4: "follow", 6: "callback" };

/** The sign for an ending: 02 an arrow that runs on, 03 a question bubble, 04 a follow button with a 2, 06 a turn-back arrow. */
export const endingMark = (ending: number | undefined): EndingMarkKind | undefined => (ending === undefined ? undefined : MARKS[ending]);

const POSES: Partial<Record<number, Pose>> = { 2: "surprised", 3: "thinking", 4: "point", 6: "happy" };

/** How a mascot reacts in the last scene: surprised at a cliffhanger, thinking over a question, pointing at the follow button. */
export const endingPose = (ending: number | undefined): Pose => (ending === undefined ? undefined : POSES[ending]) ?? "happy";

/** Where the engine draws the sign when the style does not draw it in its own last scene: top centre, above every caption style. */
export const END_MARK_BOX: Rect = { x: 340, y: 225, w: 400, h: 165 };

/** The frames the sign is on screen: the whole last scene. */
export function endingMarkSpan(plan: VideoPlan): { fromFrame: number; toFrame: number } | undefined {
  const last = plan.scenes.at(-1);
  if (!last || !endingMark(plan.ending)) return undefined;
  return { fromFrame: last.fromFrame, toFrame: plan.durationInFrames };
}

/** The frames the engine draws the sign: none when the style draws it in its own last scene, whatever scene the ending has. */
export function engineMarkSpan(plan: VideoPlan, styleDrawsMark: boolean): { fromFrame: number; toFrame: number } | undefined {
  return styleDrawsMark ? undefined : endingMarkSpan(plan);
}

/** Frames the video runs on after the voice-over: a loop cuts back to the start sooner. */
export const tailFrames = (ending: number | undefined): number => (ending === SEAMLESS_LOOP ? 6 : 15);

/** A loop's last frames fade into its first frame, so the replay has no visible cut. */
export const LOOP_FADE_FRAMES = 9;
