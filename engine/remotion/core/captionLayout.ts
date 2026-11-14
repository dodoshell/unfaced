import { type Caption, createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import type { CSSProperties } from "react";
import type { Scene } from "../../src/plan/types.js";
import { contrast, isHex, luminance } from "./contrast.js";
import type { Rect } from "./safeZone.js";

const WHITE = "#FFFFFF";

/**
 * The palette colours the captions use. Their text is white on an ink outline or card, so the
 * ink must be dark: when the palette's ink (role 5) is light, as chalk on a chalkboard, its
 * darkest colour takes over, or black.
 */
export function captionColours(palette: string[]): { accent: string; highlight: string; ink: string } {
  const [, accent = "#FF6B35", , highlight = accent, ink = "#000000"] = palette;
  const readable = (c: string) => isHex(c) && contrast(c, WHITE) >= 4.5;
  const darkest = palette.filter(readable).sort((a, b) => luminance(a) - luminance(b))[0];
  return { accent, highlight, ink: readable(ink) ? ink : (darkest ?? "#000000") };
}

/** The smallest caption type; below it a phrase is better cut into shorter pages (maxWords). */
const MIN_CAPTION_SIZE = 24;

/**
 * The largest type size up to `base` at which a phrase fits a caption box: its longest word
 * across the width, and its lines, wrapped word by word, within the height the checks trust.
 * Character widths are estimated: 0.6 em, or 0.7 em in capitals.
 */
export function fitCaptionSize(texts: string[], width: number, height: number, base: number, lineHeight: number, upper = false): number {
  const em = upper ? 0.7 : 0.6;
  const lengths = texts.map((t) => t.length);
  for (let size = base; size > MIN_CAPTION_SIZE; size--) {
    const perLine = width / (size * em);
    if (Math.max(0, ...lengths) > perLine) continue;
    let lines = 1;
    let used = -1;
    for (const n of lengths) {
      if (used + 1 + n > perLine) {
        lines++;
        used = n;
      } else used += 1 + n;
    }
    if (lines * size * lineHeight <= height) return size;
  }
  return MIN_CAPTION_SIZE;
}

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

/**
 * The box a caption style draws its phrase in. The type is sized from estimated letter widths,
 * so a word wider than estimated breaks inside the box instead of running out of it.
 */
export function captionBoxCss(n: number, align: "center" | "flex-end" = "center"): CSSProperties {
  const { box } = captionStyle(n);
  return { position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", alignItems: align, justifyContent: "center", textAlign: "center", overflowWrap: "anywhere" };
}

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

/** Whether the captions show a scene's words: not the title's, which already shows the hook in big type. */
export const showsCaptions = (scene: Scene): boolean => scene.kind !== "title";

/**
 * The caption pages a video shows: one per phrase, built scene by scene so a phrase
 * never runs across a scene change. A page stays up until the next one starts, or
 * until its scene ends. Each token lights up from `fromMs` to `toMs`.
 */
export function captionPages(scenes: Scene[], fps: number, maxWords = CAPTION_MAX_WORDS): TikTokPage[] {
  return scenes.filter(showsCaptions).flatMap((scene) => {
    const sceneEndMs = ((scene.fromFrame + scene.durationInFrames) / fps) * 1000;
    const built = captionPhrases(scene.words, maxWords).map((phrase) => {
      const captions: Caption[] = phrase.map((w) => ({ text: ` ${w.text}`, startMs: w.startMs, endMs: w.endMs, timestampMs: null, confidence: null }));
      return createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: Number.MAX_SAFE_INTEGER }).pages[0]!;
    });
    return built.map((page, i) => ({ ...page, durationMs: (built[i + 1]?.startMs ?? Math.max(sceneEndMs, page.startMs + page.durationMs)) - page.startMs }));
  });
}
