// Font fitting without measuring: estimates line breaks from an average letter width, so
// layouts and checks can run in Node without a browser.

/** The lines `text` wraps into in a box `width` wide, at `charW` pixels per letter. */
export function wrapLines(text: string, width: number, charW: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length * charW > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * `text` as it fits in `maxLines` lines `width` wide at `charW` pixels per letter: unchanged
 * when it wraps into that many, otherwise cut after the last whole word that fits (or inside a
 * word longer than the line) and ended with an ellipsis.
 */
export function fitLines(text: string, width: number, charW: number, maxLines: number): string {
  const lines = wrapLines(text, width, charW);
  if (lines.length <= maxLines && lines.every((l) => l.length * charW <= width)) return text;
  const perLine = Math.max(1, Math.floor(width / charW));
  const kept = lines.slice(0, Math.max(1, maxLines));
  let last = kept.pop()!;
  // Drop words from the end of the last line until the ellipsis fits after it.
  while (last.length + 1 > perLine && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  if (last.length + 1 > perLine) last = last.slice(0, perLine - 1);
  return [...kept, `${last.replace(/[\s.,;:!?]+$/, "")}…`].join(" ");
}

export interface FitOptions {
  /** Average letter width as a share of the font size (about 0.6 for a bold rounded sans). */
  charWidth?: number;
  /** Line height as a share of the font size. */
  lineHeight?: number;
}

/** The largest font size (2 px steps, from `max` down to `min`) at which `text` fits `box` when wrapped. */
export function fitFontSize(text: string, box: { w: number; h: number }, max: number, min: number, { charWidth = 0.6, lineHeight = 1.15 }: FitOptions = {}): number {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = max; size > min; size -= 2) {
    const charW = size * charWidth;
    const widest = Math.max(0, ...words.map((w) => w.length * charW));
    if (widest <= box.w && wrapLines(text, box.w, charW).length * size * lineHeight <= box.h) return size;
  }
  return min;
}
