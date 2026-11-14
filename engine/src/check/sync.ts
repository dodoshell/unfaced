import { captionPages } from "../../remotion/core/captionLayout.js";
import type { VideoPlan } from "../plan/types.js";
import type { WordTiming } from "../timing/align.js";
import type { CheckIssue } from "./types.js";

/** A word as the captions show it, and when it lights up. */
export interface ShownWord {
  text: string;
  fromMs: number;
}

/** Captions may light a word at most this many frames before or after it is spoken. */
export const MAX_DRIFT_FRAMES = 2;

/** A word closer than this to the start or end of the video may sound cut off. */
export const EDGE_MS = 80;

/** The words the captions light up, in order, computed exactly as the renderer does. */
export function shownWords(plan: VideoPlan): ShownWord[] {
  return captionPages(plan.scenes, plan.fps).flatMap((page) => page.tokens.map((t) => ({ text: t.text.trim(), fromMs: t.fromMs })));
}

/** Compares the captions with the voice-over word by word; one issue per run of drifting words. */
export function checkSync(shown: ShownWord[], words: WordTiming[], fps: number): CheckIssue[] {
  if (shown.length !== words.length) {
    return [{ check: "sync", atMs: 0, severity: "error", message: `The captions show ${shown.length} words but the voice-over has ${words.length}` }];
  }
  const issues: CheckIssue[] = [];
  let drifting = false;
  words.forEach((word, i) => {
    const drift = ((shown[i]!.fromMs - word.startMs) * fps) / 1000;
    const off = Math.abs(drift) > MAX_DRIFT_FRAMES + 1e-6;
    if (off && !drifting) {
      const frames = Math.round(Math.abs(drift));
      issues.push({ check: "sync", atMs: word.startMs, severity: "error", message: `Captions are ${frames} frames ${drift > 0 ? "behind" : "ahead of"} the voice at "${word.text}"` });
    }
    drifting = off;
  });
  return issues;
}

/** Reports a first or last word too close to the edge of the video. */
export function checkEdges(words: WordTiming[], durationMs: number): CheckIssue[] {
  const first = words[0];
  const last = words.at(-1);
  if (!first || !last) return [];
  const issues: CheckIssue[] = [];
  if (first.startMs < EDGE_MS) {
    issues.push({ check: "cut-word", atMs: first.startMs, severity: "error", message: `The first word, "${first.text}", starts ${Math.round(first.startMs)} ms into the video and may sound cut off` });
  }
  if (durationMs - last.endMs < EDGE_MS) {
    issues.push({ check: "cut-word", atMs: last.startMs, severity: "error", message: `The last word, "${last.text}", ends ${Math.round(durationMs - last.endMs)} ms before the video does and may sound cut off` });
  }
  return issues;
}
