import type { Rig } from "../../remotion/core/character/types.js";
import type { WordTiming } from "../timing/align.js";

export type SceneKind = "title" | "fact" | "list" | "outro";

export interface Scene {
  beatId: string;
  kind: SceneKind;
  /** The beat's text as written (list items on their own lines). */
  text: string;
  fromFrame: number;
  durationInFrames: number;
  /** The words spoken during this scene, with times from the start of the video. */
  words: WordTiming[];
}

export interface VideoPlan {
  fps: 30;
  width: 1080;
  height: 1920;
  durationInFrames: number;
  style: number;
  captions: number;
  palette: string[];
  /** The soundtrack (voice-over, music or both), relative to the video folder; none for a silent video. */
  audioSrc?: string;
  /** The voice type from the catalog; 8 means text only (no voice-over). */
  voice?: number;
  /** The music mood from the catalog, when the soundtrack has music. */
  music?: number;
  /** The ending type from the catalog, so the last scene can show it. */
  ending?: number;
  /** The page's mascot, shown by the style's scenes. */
  mascot?: Mascot;
  scenes: Scene[];
}

/** A page's recurring character: a name and a rig (see brand/mascot/mascot.json). */
export interface Mascot {
  name: string;
  rig: Rig;
}
