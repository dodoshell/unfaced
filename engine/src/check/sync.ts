import { captionPages, captionStyle, showsCaptions } from "../../remotion/core/captionLayout.js";
import type { VideoPlan } from "../plan/types.js";
import { durationMs, type Pcm, speechAt } from "../audio/speech.js";
import type { CheckIssue } from "./types.js";

/** A word as the captions show it, and when it lights up. */
export interface ShownWord {
  text: string;
  fromMs: number;
}

/** Captions may light a word at most this many frames before or after it is spoken. */
export const MAX_DRIFT_FRAMES = 2;

/** Speech closer than this to the start or end of the video may sound cut off. */
export const EDGE_MS = 80;

/** The words the captions light up, in order, computed exactly as the renderer does. */
export function shownWords(plan: VideoPlan): ShownWord[] {
  return captionPages(plan.scenes, plan.fps, captionStyle(plan.captions).maxWords).flatMap((page) => page.tokens.map((t) => ({ text: t.text.trim(), fromMs: t.fromMs })));
}

/** The onsets that fall inside a scene whose words the captions show; the others have no caption to check. */
export function captionedOnsets(plan: VideoPlan, onsets: number[]): number[] {
  const spans = plan.scenes.filter(showsCaptions).map((s) => [(s.fromFrame / plan.fps) * 1000, ((s.fromFrame + s.durationInFrames) / plan.fps) * 1000] as const);
  return onsets.filter((t) => spans.some(([from, to]) => t >= from && t < to));
}

/**
 * Compares the captions with the voice itself: wherever speech starts after a pause
 * (an onset in the soundtrack), the caption word that lights up nearest to it must
 * do so within 2 frames.
 */
export function checkSync(shown: ShownWord[], onsets: number[], fps: number): CheckIssue[] {
  const issues: CheckIssue[] = [];
  for (const onset of onsets) {
    const word = shown.reduce<ShownWord | undefined>((best, w) => (!best || Math.abs(w.fromMs - onset) < Math.abs(best.fromMs - onset) ? w : best), undefined);
    if (!word) continue;
    const drift = ((word.fromMs - onset) * fps) / 1000;
    if (Math.abs(drift) <= MAX_DRIFT_FRAMES + 1e-6) continue;
    const frames = Math.round(Math.abs(drift));
    issues.push({ check: "sync", atMs: onset, severity: "error", message: `Captions are ${frames} frames ${drift > 0 ? "behind" : "ahead of"} the voice at "${word.text}"` });
  }
  return issues;
}

/** Reports speech in the first or last 80 ms of the soundtrack, where a word may sound cut off. */
export function checkEdges(soundtrack: Pcm): CheckIssue[] {
  const end = durationMs(soundtrack);
  const issues: CheckIssue[] = [];
  if (speechAt(soundtrack, 0, EDGE_MS)) {
    issues.push({ check: "cut-word", atMs: 0, severity: "error", message: `Speech starts in the first ${EDGE_MS} ms, so the first word may sound cut off` });
  }
  if (speechAt(soundtrack, end - EDGE_MS, end)) {
    issues.push({ check: "cut-word", atMs: end - EDGE_MS, severity: "error", message: `Speech runs into the last ${EDGE_MS} ms, so the last word may sound cut off` });
  }
  return issues;
}
