import type { WordTiming } from "./align.js";

/** Silence before the first word of a text-only video. */
export const READING_LEAD_IN_MS = 400;
const BASE_MS = 230;
const PER_CHAR_MS = 28;
const COMMA_PAUSE_MS = 250;
const SENTENCE_PAUSE_MS = 550;
const HOLD_MS = 900;

/**
 * Word timings for a video without a voice (voice 08, text only): each word gets time
 * by its length, with pauses after commas and sentences, so captions can be read
 * comfortably (about 140 to 180 words a minute).
 */
export function readingTimings(text: string): { words: WordTiming[]; durationSec: number } {
  const words: WordTiming[] = [];
  let at = READING_LEAD_IN_MS;
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const letters = token.replace(/[^\p{L}\p{N}]/gu, "").length;
    const endMs = at + BASE_MS + PER_CHAR_MS * letters;
    words.push({ text: token, startMs: at, endMs });
    at = endMs + (/[.!?…]["'’”)]*$/.test(token) ? SENTENCE_PAUSE_MS : /[,;:]["'’”)]*$/.test(token) ? COMMA_PAUSE_MS : 40);
  }
  const lastEnd = words.at(-1)?.endMs ?? READING_LEAD_IN_MS;
  return { words, durationSec: (lastEnd + HOLD_MS) / 1000 };
}
