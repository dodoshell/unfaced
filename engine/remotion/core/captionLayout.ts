import { type Caption, createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import type { Scene } from "../../src/plan/types.js";
import type { Rect } from "./safeZone.js";

/** Where captions are drawn: the lower middle of the frame, inside the safe zone. */
export const CAPTION_BOX: Rect = { x: 60, y: 1180, w: 880, h: 330 };

export const CAPTION_FONT_SIZE = 76;

export const CAPTION_MAX_WORDS = 5;

/** Where each caption style draws, how many words a phrase holds and its type size. */
export interface CaptionStyle {
  box: Rect;
  maxWords: number;
  fontSize: number;
}

/** Every caption style in the catalog (catalog/captions.md), by number. */
export const CAPTION_STYLES: Record<number, CaptionStyle> = {
  1: { box: CAPTION_BOX, maxWords: CAPTION_MAX_WORDS, fontSize: CAPTION_FONT_SIZE },
  2: { box: { x: 60, y: 1160, w: 880, h: 360 }, maxWords: 3, fontSize: 104 },
  3: { box: { x: 60, y: 1200, w: 880, h: 300 }, maxWords: 6, fontSize: 60 },
  4: { box: { x: 60, y: 1400, w: 880, h: 140 }, maxWords: 8, fontSize: 46 },
  5: { box: CAPTION_BOX, maxWords: 4, fontSize: 84 },
  6: { box: CAPTION_BOX, maxWords: 6, fontSize: 70 },
};

export function captionStyle(n: number): CaptionStyle {
  const style = CAPTION_STYLES[n];
  if (!style) throw new Error(`captions ${n} has no renderer; caption styles: ${Object.keys(CAPTION_STYLES).join(", ")}`);
  return style;
}

/** The phrase's key word: its longest, counting letters and digits only (the last on a tie: key words tend to come late). */
export function keywordIndex(texts: string[]): number {
  const len = (t: string) => t.replace(/[^\p{L}\p{N}]/gu, "").length;
  return texts.reduce((best, t, i) => (len(t) >= len(texts[best]!) ? i : best), 0);
}

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

/**
 * The caption pages a video shows: one per phrase, built scene by scene so a phrase
 * never runs across a scene change. A page stays up until the next one starts, or
 * until its scene ends. Each token lights up from `fromMs` to `toMs`.
 */
export function captionPages(scenes: Scene[], fps: number, maxWords = CAPTION_MAX_WORDS): TikTokPage[] {
  return scenes.flatMap((scene) => {
    const sceneEndMs = ((scene.fromFrame + scene.durationInFrames) / fps) * 1000;
    const built = captionPhrases(scene.words, maxWords).map((phrase) => {
      const captions: Caption[] = phrase.map((w) => ({ text: ` ${w.text}`, startMs: w.startMs, endMs: w.endMs, timestampMs: null, confidence: null }));
      return createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: Number.MAX_SAFE_INTEGER }).pages[0]!;
    });
    return built.map((page, i) => ({ ...page, durationMs: (built[i + 1]?.startMs ?? Math.max(sceneEndMs, page.startMs + page.durationMs)) - page.startMs }));
  });
}
