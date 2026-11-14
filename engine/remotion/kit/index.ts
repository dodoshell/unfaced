// What a style or a video's own scenes/ code imports from unfaced ("@unfaced/kit" in a
// video's scenes/ folder). Remotion and React are imported directly.
import { useContext } from "react";
import type { Mascot } from "../../src/plan/types.js";
import { VideoContext } from "../core/VideoContext.js";

export { Character, type CharacterProps } from "../core/character/Character.js";
export { characterParts, partBounds, shade } from "../core/character/parts.js";
export { rigFor } from "../core/character/rig.js";
export { FigureFrame, type FigureProps, mirrorParts, plainPart, polygonPath, smoothPath } from "../core/character/svg.js";
export { ACCESSORIES, FIGURE_BOX, POSES, SPECIES, type Part, type Pose, type Rig, type Species } from "../core/character/types.js";
export { CAPTION_BOX, CAPTION_STYLES, captionStyle, type CaptionStyle } from "../core/captionLayout.js";
export { EndingMark, type EndingMarkProps, markColours } from "../core/EndingMark.js";
export { END_MARK_BOX, type EndingMarkKind, endingMark, endingPose } from "../core/endings.js";
export { FRAME, SAFE_ZONE, type Rect } from "../core/safeZone.js";
export { useVideo, VideoContext } from "../core/VideoContext.js";
export { defineScenes, type SceneComponent } from "../core/videoScenes.js";
export type { Mascot, Scene, VideoPlan } from "../../src/plan/types.js";

/** The page's mascot, if the page has one. */
export function useMascot(): Mascot | undefined {
  return useContext(VideoContext)?.plan.mascot;
}
