import type { Pause } from "../audio/speech.js";
import type { WordTiming } from "./align.js";

/** A pause whose next word whisper places further away than this is left alone. */
const MAX_SHIFT_MS = 800;
const MIN_WORD_MS = 10;

/**
 * Whisper places the first word after a pause up to half a second off, often
 * stretching it back over the pause. For each pause the audio shows, the first word
 * that is mostly spoken after it is moved to start exactly where the voice starts
 * again, and the word before ends no later.
 */
export function snapToPauses(words: WordTiming[], pauses: Pause[]): WordTiming[] {
  const out = words.map((w) => ({ ...w }));
  for (const pause of pauses) {
    const k = out.findIndex((w) => Math.max(0, w.endMs - pause.toMs) > Math.max(0, Math.min(w.endMs, pause.fromMs) - w.startMs));
    const word = out[k];
    if (!word || Math.abs(word.startMs - pause.toMs) > MAX_SHIFT_MS) continue;
    word.startMs = Math.min(pause.toMs, word.endMs - MIN_WORD_MS);
    const before = out[k - 1];
    if (before) before.endMs = Math.min(before.endMs, word.startMs);
  }
  return out;
}
