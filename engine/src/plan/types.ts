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
  /** The voice-over, relative to the video folder. */
  audioSrc: string;
  scenes: Scene[];
}
