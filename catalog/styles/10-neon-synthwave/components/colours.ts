// Colour helpers for style 10, pure so tests can run them without rendering.
import { colour } from "./layout.js";

type RGB = [number, number, number];

/** #RGB, #RRGGBB or rgb()/rgba() as 0–255 channels; undefined for anything else. */
function rgb(c: string): RGB | undefined {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map((d) => d + d).join("") : hex[1]!;
    const n = Number.parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(c);
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : undefined;
}

const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** `a` mixed towards `b` by `t` (0 → a, 1 → b). Colours that can't be read pass through as `a`. */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return a;
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

/** The colour with an alpha, as rgba(). */
export function alpha(c: string, a: number): string {
  const x = rgb(c);
  return x ? `rgba(${x[0]}, ${x[1]}, ${x[2]}, ${a})` : c;
}

/** Relative brightness, 0 (black) to 1 (white). */
export function luminance(c: string): number {
  const x = rgb(c);
  return x ? (0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]) / 255 : 0.5;
}

/**
 * The colour as a lit neon tube: same hue, fully saturated and bright. Greys (white clouds,
 * black line work) become a cool white tube.
 */
export function neon(c: string): string {
  const x = rgb(c);
  if (!x) return c;
  const [r, g, b] = x.map((v) => v / 255) as RGB;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.15 || d < 0.06) return "#E6F6FF";
  let h = 0;
  if (max === r) h = ((g - b) / d + 6) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  // HSL back to RGB at full saturation and a bright lightness.
  const L = h > 40 && h < 190 ? 0.56 : 0.62;
  const C = 1 - Math.abs(2 * L - 1);
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  const [r1, g1, b1] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return toHex([(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]);
}

/**
 * The night colour: what the glass panels, the floor and the figures' bodies are filled with.
 * The darker of the background and the ink, pushed darker when a page palette has neither dark.
 */
export function night(palette: string[]): string {
  const [bg, ink] = [colour(palette, 0), colour(palette, 4)];
  const dark = luminance(bg) <= luminance(ink) ? bg : ink;
  return luminance(dark) > 0.3 ? mix(dark, "#000000", 0.8) : dark;
}

/** The white-hot core of a tube of colour `c`. */
export const core = (c: string) => mix(c, "#FFFFFF", 0.62);
