import type { Rect } from "./types.js";
import { loadMetrics } from "./fonts.js";

export interface TextSpec {
  text: string;
  /** Font file (absolute path). */
  font: string;
  accentFont?: string;
  /** Indices into `text`. */
  accent?: { start: number; end: number };
  box: Rect;
  maxSize: number;
  minSize: number;
  lineHeight: number;
  maxLines?: number;
  /** Extra spacing per character, in em. */
  tracking?: number;
  upper?: boolean;
  /**
   * Evens out the lines: keeps the size and line count the fit found, then breaks the words
   * as narrowly as that line count allows, so a headline has no lone last word.
   */
  balance?: boolean;
}

export interface FittedText {
  size: number;
  /** `width` is in the same units as `box`; `accent` is local to the line's text. */
  lines: { text: string; width: number; accent?: { start: number; end: number } }[];
  height: number;
}

export class FitError extends Error {
  constructor(
    public kind: "overflow" | "glyph",
    public detail: string,
    message: string,
  ) {
    super(message);
    this.name = "FitError";
  }
}

interface Word {
  start: number;
  end: number;
}

function words(text: string): Word[] {
  const out: Word[] = [];
  for (const m of text.matchAll(/\S+/g)) out.push({ start: m.index!, end: m.index! + m[0].length });
  return out;
}

export function fitText(spec: TextSpec): FittedText {
  const { text, box } = spec;
  const main = loadMetrics(spec.font);
  const accentMetrics = spec.accentFont ? loadMetrics(spec.accentFont) : main;
  const tracking = spec.tracking ?? 0;
  const acc = spec.accent;
  const inAccent = (i: number) => !!acc && i >= acc.start && i < acc.end;

  const shown = (s: string) => (spec.upper ? s.toUpperCase() : s);

  // Missing glyphs, checked against the font each character is drawn with.
  const missing: string[] = [];
  let offset = 0;
  for (const ch of text) {
    const font = inAccent(offset) ? accentMetrics : main;
    for (const m of font.missing(shown(ch))) if (!missing.includes(m)) missing.push(m);
    offset += ch.length;
  }
  if (missing.length) {
    throw new FitError("glyph", missing.join(" "), `The font has no glyph for ${missing.map((c) => `"${c}"`).join(", ")}; remove or replace it.`);
  }

  /** Width in em of text[from, to), with each run in its own font. */
  const measure = (from: number, to: number): number => {
    let em = 0;
    let i = from;
    while (i < to) {
      const a = inAccent(i);
      let j = i;
      while (j < to && inAccent(j) === a) j++;
      em += (a ? accentMetrics : main).advance(shown(text.slice(i, j)));
      i = j;
    }
    return em + [...text.slice(from, to)].length * tracking;
  };

  const ws = words(text);
  const first = text.slice(0, 40);

  /** Greedy line breaks at `size` within `width`. */
  const wrap = (size: number, width: number): [number, number][] => {
    const lineRanges: [number, number][] = [];
    let cur: [number, number] | null = null;
    for (const w of ws) {
      if (cur && measure(cur[0], w.end) * size <= width) {
        cur[1] = w.end;
      } else {
        if (cur) lineRanges.push(cur);
        cur = [w.start, w.end];
      }
    }
    if (cur) lineRanges.push(cur);
    return lineRanges;
  };

  /** The narrowest width (to a pixel) that still breaks into `count` lines at `size`, never wider than the box. */
  const balanced = (size: number, count: number): [number, number][] => {
    let lo = Math.max(...ws.map((w) => measure(w.start, w.end) * size));
    let hi = box.w;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      if (wrap(size, mid).length <= count) hi = mid;
      else lo = mid;
    }
    return wrap(size, hi);
  };

  const attempt = (size: number): FittedText | null => {
    let lineRanges = wrap(size, box.w);
    if (spec.balance && lineRanges.length > 1) lineRanges = balanced(size, lineRanges.length);
    if (spec.maxLines !== undefined && lineRanges.length > spec.maxLines) return null;
    const height = lineRanges.length * size * spec.lineHeight;
    if (height > box.h) return null;
    const lines = lineRanges.map(([s, e]) => {
      const line: FittedText["lines"][number] = { text: text.slice(s, e), width: measure(s, e) * size };
      if (acc) {
        const a = Math.max(acc.start, s);
        const b = Math.min(acc.end, e);
        if (a < b) line.accent = { start: a - s, end: b - s };
      }
      return line;
    });
    if (lines.some((l) => l.width > box.w)) return null;
    return { size, lines, height };
  };

  const sizes: number[] = [];
  for (let s = spec.maxSize; s >= spec.minSize; s -= 2) sizes.push(s);
  if (sizes[sizes.length - 1] !== spec.minSize) sizes.push(spec.minSize);
  for (const size of sizes) {
    const fitted = attempt(size);
    if (fitted) return fitted;
  }
  throw new FitError(
    "overflow",
    first,
    `Text does not fit a ${box.w}x${box.h} box at ${spec.minSize}px: "${first}"; shorten it or split the slide.`,
  );
}
