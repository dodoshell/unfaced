// Colour contrast, pure so layouts and tests can use it without rendering.

const HEX = /^#[0-9a-f]{6}$/i;

/** Whether `colour` is written #RRGGBB. */
export const isHex = (colour: string): boolean => HEX.test(colour);

/** The relative luminance of a #RRGGBB colour, from 0 (black) to 1 (white); 0 for anything else. */
export function luminance(colour: string): number {
  if (!isHex(colour)) return 0;
  const n = Number.parseInt(colour.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** The WCAG contrast ratio of two colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (l1! + 0.05) / (l2! + 0.05);
}

/** `a` mixed `t` of the way towards `b`, both #RRGGBB (anything else counts as mid grey). */
export function mix(a: string, b: string, t: number): string {
  const rgb = (c: string) => (isHex(c) ? [16, 8, 0].map((s) => (Number.parseInt(c.slice(1), 16) >> s) & 255) : [128, 128, 128]);
  const [p, q] = [rgb(a), rgb(b)];
  return `#${p.map((c, i) => Math.round(c + (q[i]! - c) * t).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/**
 * `colour` when it reads on `background` at `ratio`, otherwise mixed towards white or black
 * (whichever reads better there) a tenth at a time until it does, so it keeps its hue as long
 * as it can: for a coloured accent that must stay coloured, where readableOn would swap it out.
 */
export function liftedOn(background: string, colour: string, ratio = 3): string {
  const towards = contrast("#FFFFFF", background) >= contrast("#000000", background) ? "#FFFFFF" : "#000000";
  for (let t = 0; t < 1; t += 0.1) {
    const c = t === 0 ? colour : mix(colour, towards, t);
    if (contrast(c, background) >= ratio) return c;
  }
  return towards;
}

/** `colour` when it reads on `background` (4.5:1, as for body text), otherwise white or near black, whichever reads better. */
export function readableOn(background: string, colour: string): string {
  if (contrast(colour, background) >= 4.5) return colour;
  return contrast("#FFFFFF", background) >= contrast("#1B1B1F", background) ? "#FFFFFF" : "#1B1B1F";
}
