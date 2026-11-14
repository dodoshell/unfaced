// The typesetting and timing of style 12, pure so the layout checks and tests run it without a
// browser: Anton's letter widths, lines set to fill a width, the key word on stage for each
// caption phrase, and when each list item lands.
import { listParts } from "../../../../engine/remotion/core/badges.js";
import { captionPhrases } from "../../../../engine/remotion/core/captionLayout.js";
import type { Scene } from "../../../../engine/src/plan/types.js";

/** Anton's advance widths in thousandths of an em, measured from fonts/Anton.ttf (upper case, digits, punctuation). */
const WIDTHS: Record<string, number> = {
  A: 485, B: 479, C: 474, D: 493, E: 412, F: 399, G: 485, H: 499, I: 227, J: 466, K: 472, L: 397, M: 746,
  N: 498, O: 486, P: 472, Q: 494, R: 477, S: 461, T: 396, U: 474, V: 469, W: 712, X: 484, Y: 446, Z: 410,
  "0": 494, "1": 331, "2": 494, "3": 494, "4": 494, "5": 494, "6": 494, "7": 494, "8": 494, "9": 494,
  " ": 234, ".": 229, ",": 236, ":": 242, ";": 245, "!": 229, "?": 492, "'": 214, "’": 232, '"': 429, "“": 464, "”": 463,
  "-": 311, "–": 311, "—": 563, "&": 520, "%": 1057, $: 462, "#": 546, "@": 864, "(": 291, ")": 291, "/": 405, "+": 355,
};
/** Letters missing from the table (accented capitals and the like) count as an average letter. */
const AVERAGE = 480;
/** Anton's cap height as a share of the font size: lines are stacked by their capitals. */
export const CAP = 0.86;

/** The width of `text` set in Anton capitals, in ems. */
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text.toUpperCase()) w += WIDTHS[ch] ?? AVERAGE;
  return w / 1000;
}

export interface TypeLine {
  text: string;
  /** Font size in pixels; the line's capitals are `size * CAP` tall. */
  size: number;
  /** The line's width in pixels at that size (it is drawn to exactly this width). */
  width: number;
}

export interface FitLinesOptions {
  maxLines?: number;
  /** The largest font size a line may take, in pixels. */
  maxSize?: number;
  /** Space between stacked lines, as a share of the smaller line's size. */
  gap?: number;
  /** The share of the box width lines fill, leaving room for a push-in. */
  fill?: number;
}

/** The words split into `n` lines of as even a width as possible (in ems). */
function splitEven(words: string[], n: number): string[][] {
  const width = (from: number, to: number) => textWidth(words.slice(from, to).join(" "));
  // best[k][i]: the narrowest widest line setting the first i words in k lines.
  const best = Array.from({ length: n + 1 }, () => new Array<number>(words.length + 1).fill(Infinity));
  const cut = Array.from({ length: n + 1 }, () => new Array<number>(words.length + 1).fill(0));
  best[0]![0] = 0;
  for (let k = 1; k <= n; k++) {
    for (let i = k; i <= words.length; i++) {
      for (let j = k - 1; j < i; j++) {
        const w = Math.max(best[k - 1]![j]!, width(j, i));
        if (w < best[k]![i]!) {
          best[k]![i] = w;
          cut[k]![i] = j;
        }
      }
    }
  }
  const lines: string[][] = [];
  for (let k = n, i = words.length; k > 0; k--) {
    const j = cut[k]![i]!;
    lines.unshift(words.slice(j, i));
    i = j;
  }
  return lines;
}

/**
 * Sets `text` in Anton capitals as a justified stack: each line scaled to fill the box width
 * (up to `maxSize`), the whole stack shrunk to fit the height. Picks the number of lines that
 * gives the largest smallest line, so every line stays big.
 */
export function fitLines(text: string, box: { w: number; h: number }, { maxLines = 6, maxSize = 420, gap = 0.12, fill = 1 }: FitLinesOptions = {}): TypeLine[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const w = box.w * fill;
  let best: TypeLine[] = [];
  let bestScore = -1;
  for (let n = 1; n <= Math.min(maxLines, words.length); n++) {
    const lines = splitEven(words, n).map((l) => l.join(" "));
    const sizes = lines.map((l) => Math.min(maxSize, w / textWidth(l)));
    const gaps = sizes.slice(1).reduce((sum, s, i) => sum + gap * Math.min(s, sizes[i]!), 0);
    const height = sizes.reduce((sum, s) => sum + s * CAP, 0) + gaps;
    const shrink = Math.min(1, box.h / height);
    const set = lines.map((l, i) => ({ text: l, size: Math.floor(sizes[i]! * shrink), width: Math.floor(sizes[i]! * shrink * textWidth(l)) }));
    const score = Math.min(...set.map((l) => l.size));
    if (score > bestScore) {
      best = set;
      bestScore = score;
    }
  }
  return best;
}

/** The height of a stack of lines, gaps included. */
export function stackHeight(lines: TypeLine[], gap = 0.12): number {
  return lines.reduce((sum, l, i) => sum + l.size * CAP + (i > 0 ? gap * Math.min(l.size, lines[i - 1]!.size) : 0), 0);
}

/** Small words that never make the key word of a phrase. */
const SMALL = new Set(
  (
    "a an the and or but so nor of to in on at for with from by as into onto about than then " +
    "is are was were be been being am do does did done have has had having can could will would shall should may might must " +
    "i me my we us our you your you're they them their they're he him his she her it its it's this that that's these those there here " +
    "not no yes just also even very really too only all some any each when while what why how who which where because if " +
    "up down out off over under again more most such own same both few"
  ).split(" "),
);

const bare = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");

/**
 * The key word of a phrase: its longest word that isn't a small word, with a bonus for the
 * last one (the point of a phrase tends to come at its end). Falls back to the longest word.
 */
export function keyword(words: string[]): number {
  const content = words.map((w, i) => ({ i, w: bare(w) })).filter(({ w }) => w.length > 0 && !SMALL.has(w));
  const pool = content.length > 0 ? content : words.map((w, i) => ({ i, w: bare(w) }));
  const last = content.length > 0 ? pool.at(-1)?.i : undefined;
  let best = pool[0]?.i ?? 0;
  let bestScore = -1;
  for (const { i, w } of pool) {
    const score = w.replace(/'/g, "").length + (i === last ? 1 : 0);
    if (score >= bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

/** A word as the stage shows it: capitals, without the quotes and punctuation round it, keeping a final ? or !. */
export function stageText(word: string): string {
  const end = /[?!]+["'’”)]*$/.exec(word)?.[0].replace(/["'’”)]/g, "") ?? "";
  return word.replace(/^["'‘“(]+|[^\p{L}\p{N}]+$/gu, "").toUpperCase() + end;
}

export interface Beat {
  /** The key word, as the stage shows it. */
  text: string;
  /** Frames from the start of the scene: when the phrase starts (the stage cuts to it), when its key word is said, when it ends. */
  from: number;
  hit: number;
  to: number;
  /** When each word of the phrase is said, for the stage's word ticks. */
  ticks: number[];
}

interface Timed {
  text: string;
  startMs: number;
}

/** The scene's spoken words, or its written words spread evenly over it when it has no voice. */
function spokenWords(scene: Scene, fps: number): Timed[] {
  if (scene.words.length > 0) return scene.words;
  const words = scene.text.split(/\s+/).filter(Boolean);
  const startMs = (scene.fromFrame / fps) * 1000;
  const spanMs = (scene.durationInFrames / fps) * 1000;
  return words.map((text, i) => ({ text, startMs: startMs + (spanMs * i) / Math.max(1, words.length) }));
}

/**
 * What the stage shows over a scene: one beat per caption phrase (the same phrases the captions
 * show), each holding the phrase's key word. The first beat starts with the scene.
 */
export function stageBeats(scene: Scene, fps: number, maxWords: number): Beat[] {
  const frameOf = (ms: number) => Math.round((ms / 1000) * fps) - scene.fromFrame;
  const phrases = captionPhrases(spokenWords(scene, fps), maxWords);
  return phrases.map((phrase, i): Beat => {
    const k = keyword(phrase.map((w) => w.text));
    const next = phrases[i + 1];
    return {
      text: stageText(phrase[k]!.text),
      from: i === 0 ? 0 : frameOf(phrase[0]!.startMs),
      hit: Math.max(0, frameOf(phrase[k]!.startMs)),
      to: next ? frameOf(next[0]!.startMs) : scene.durationInFrames,
      ticks: phrase.map((w) => frameOf(w.startMs)),
    };
  });
}

/** The beat on stage at `frame` (frames from the start of the scene), and its place in the scene. */
export function beatAt(beats: Beat[], frame: number): { beat: Beat; index: number } | undefined {
  let index = -1;
  beats.forEach((b, i) => {
    if (b.from <= frame) index = i;
  });
  if (beats.length === 0) return undefined;
  index = Math.max(0, index);
  return { beat: beats[index]!, index };
}

/**
 * When each item of a list lands, in frames from the start of the scene: as the voice reaches
 * its first word. The written words are matched to the spoken ones by position, scaled when the
 * counts differ, and every item lands at least 12 frames before the scene ends.
 */
export function listReveal(scene: Scene, fps: number): number[] {
  const { header, items } = listParts(scene.text);
  const count = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const spoken = spokenWords(scene, fps);
  const written = count(header) + items.reduce((n, item) => n + count(item), 0);
  const scale = written > 0 ? spoken.length / written : 1;
  const latest = Math.max(0, scene.durationInFrames - 12);
  let at = count(header);
  return items.map((item) => {
    const word = spoken[Math.min(spoken.length - 1, Math.round(at * scale))];
    at += count(item);
    const frame = word ? Math.round((word.startMs / 1000) * fps) - scene.fromFrame : 0;
    return Math.min(latest, Math.max(0, frame));
  });
}
