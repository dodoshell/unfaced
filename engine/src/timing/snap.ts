import type { Pause } from "../audio/speech.js";
import type { WordTiming } from "./align.js";

/** A pause whose next word whisper places further away than this is left alone. */
const MAX_SHIFT_MS = 800;
const MIN_WORD_MS = 10;

/** Shorter than this, a word is one whisper squeezed, not one the voice said quickly. */
const CRUSHED_MS = 25;
/** About how long the voice takes per letter, for the share a crushed word gets back. */
const MS_PER_LETTER = 55;
const MIN_SHARE_MS = 120;

/**
 * Whisper sometimes gives a word almost no time (1 ms) and stretches the word before it
 * over both. Such a word gets back a share of the pair, by its letters, so the captions
 * light it up for a moment instead of skipping it. After a gap, the share comes from the
 * word right after it; a word with a gap on both sides is left alone.
 */
export function evenOutCrushedWords(words: WordTiming[]): WordTiming[] {
  const out = words.map((w) => ({ ...w }));
  for (let i = 0; i < out.length; i++) {
    const word = out[i]!;
    if (word.endMs - word.startMs >= CRUSHED_MS) continue;
    const letters = word.text.replace(/[^\p{L}\p{N}]/gu, "").length || 1;
    const shareOf = (span: number) => Math.min(Math.max(letters * MS_PER_LETTER, MIN_SHARE_MS), span / 2);
    const before = out[i - 1];
    const after = out[i + 1];
    if (before && before.endMs === word.startMs) {
      const span = word.endMs - before.startMs;
      const share = shareOf(span);
      if (span - share >= MIN_SHARE_MS) word.startMs = before.endMs = Math.round(word.endMs - share);
    } else if (after && after.startMs === word.endMs) {
      const span = after.endMs - word.startMs;
      const share = shareOf(span);
      if (span - share >= MIN_SHARE_MS) word.endMs = after.startMs = Math.round(word.startMs + share);
    }
  }
  return out;
}

/**
 * Whisper places the first word after a pause up to half a second off, often
 * stretching it back over the pause. For each pause the audio shows, the first word
 * that is mostly spoken after it is moved to start exactly where the voice starts
 * again, and the word before ends no later. A word whisper put wholly inside a pause,
 * nearer its end, counts as spoken after it: nobody speaks in a pause. Each pause starts
 * a different word, in order: when two pauses would start the same word, whisper put
 * the word before it too early, and that one follows the earlier pause.
 */
export function snapToPauses(words: WordTiming[], pauses: Pause[]): WordTiming[] {
  const out = words.map((w) => ({ ...w }));
  const firstAfter = pauses.map((pause) => out.findIndex((w) => follows(w, pause)));
  for (let i = firstAfter.length - 2; i >= 0; i--) {
    const next = firstAfter[i + 1]!;
    if (next >= 0 && firstAfter[i]! >= next) firstAfter[i] = next - 1;
  }
  pauses.forEach((pause, i) => {
    const k = firstAfter[i]!;
    const word = out[k];
    if (k < 0 || !word || Math.abs(word.startMs - pause.toMs) > MAX_SHIFT_MS) return;
    const after = out[k + 1];
    if (word.endMs < pause.toMs + MIN_WORD_MS && (!after || after.startMs >= pause.toMs + MIN_WORD_MS)) word.endMs = pause.toMs + MIN_WORD_MS;
    word.startMs = Math.min(pause.toMs, word.endMs - MIN_WORD_MS);
    const before = out[k - 1];
    if (before) before.endMs = Math.min(before.endMs, word.startMs);
  });
  return out;
}

/** Whether the voice says a word after the pause: more of it after the pause than before, or, wholly inside it, nearer its end. */
function follows(word: WordTiming, pause: Pause): boolean {
  const after = Math.max(0, word.endMs - pause.toMs);
  const before = Math.max(0, Math.min(word.endMs, pause.fromMs) - word.startMs);
  if (after !== before) return after > before;
  return after === 0 && word.startMs + word.endMs >= pause.fromMs + pause.toMs;
}
