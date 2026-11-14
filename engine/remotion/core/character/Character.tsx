import { useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { StyleKit } from "../../styles/registry.js";
import { VideoContext } from "../VideoContext.js";
import { characterParts } from "./parts.js";
import { type FigurePlacement, mirrorParts } from "./svg.js";
import type { Pose, Rig } from "./types.js";

export interface CharacterProps extends FigurePlacement {
  rig: Rig;
  pose: Pose;
  /** Frames to shift the pose's motion by, so two characters don't move in step. */
  offset?: number;
  /** Defaults to the video's style and palette. */
  style?: StyleKit;
  palette?: string[];
}

/** A character in a pose, painted by the style; the same in every style apart from the look. */
export const Character: React.FC<CharacterProps> = ({ rig, pose, offset = 0, style, palette, facing = 1, ...place }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const video = useContext(VideoContext);
  const kit = style ?? video?.style;
  if (!kit) throw new Error("<Character> needs a style: render it inside a video or pass style");
  const parts = characterParts(rig, pose, frame + offset, fps);
  return <kit.Figure parts={facing === -1 ? mirrorParts(parts) : parts} palette={palette ?? video?.palette ?? kit.defaultPalette} facing={facing} {...place} />;
};
