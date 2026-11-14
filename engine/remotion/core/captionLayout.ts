import type { Rect } from "./safeZone.js";

/** Where captions are drawn: the lower middle of the frame, inside the safe zone. */
export const CAPTION_BOX: Rect = { x: 60, y: 1180, w: 880, h: 330 };

export const CAPTION_FONT_SIZE = 76;

export const CAPTION_MAX_WORDS = 5;

const ENDS_PHRASE = /[.,!?;:…]["'’”)]*$/;

/**
 * Splits spoken words into caption phrases: a phrase ends after punctuation, and a
 * longer run is cut into balanced pieces of at most `maxWords`, so no word is left alone.
 */
export function captionPhrases<W extends { text: string }>(words: W[], maxWords = CAPTION_MAX_WORDS): W[][] {
  const runs: W[][] = [[]];
  for (const w of words) {
    runs.at(-1)!.push(w);
    if (ENDS_PHRASE.test(w.text)) runs.push([]);
  }
  return runs
    .filter((run) => run.length > 0)
    .flatMap((run) => {
      const pieces = Math.ceil(run.length / maxWords);
      const size = Math.ceil(run.length / pieces);
      return Array.from({ length: pieces }, (_, i) => run.slice(i * size, (i + 1) * size)).filter((p) => p.length > 0);
    });
}
