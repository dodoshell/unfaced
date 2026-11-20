import { readFileSync } from "node:fs";
import { extname } from "node:path";
import opentype from "opentype.js";

export interface FontFile {
  family: string;
  /** Absolute path. */
  file: string;
}

export interface Metrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  /** Width of `text` in em (1 = the font size). */
  advance(text: string): number;
  /** Characters of `text` the font has no glyph for (whitespace is ignored). */
  missing(text: string): string[];
}

const HINT = "use .ttf, .otf or .woff";
const cache = new Map<string, Metrics>();

export function loadMetrics(file: string): Metrics {
  const cached = cache.get(file);
  if (cached) return cached;
  if (extname(file).toLowerCase() === ".woff2") throw new Error(`Font ${file} is not supported: ${HINT}`);
  let font: opentype.Font;
  try {
    const buf = readFileSync(file);
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch (e) {
    throw new Error(`Cannot read font ${file}: ${(e as Error).message} (${HINT})`);
  }
  const upm = font.unitsPerEm;
  const metrics: Metrics = {
    unitsPerEm: upm,
    ascender: font.ascender,
    descender: font.descender,
    advance: (text) => (text ? font.getAdvanceWidth(text, upm, { kerning: true }) / upm : 0),
    missing: (text) => {
      const out: string[] = [];
      for (const ch of text) {
        if (/\s/.test(ch) || out.includes(ch)) continue;
        if (font.charToGlyphIndex(ch) === 0) out.push(ch);
      }
      return out;
    },
  };
  cache.set(file, metrics);
  return metrics;
}
