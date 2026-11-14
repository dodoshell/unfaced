// Colour roles of style 12, pure so tests can run them without rendering.
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

/** Relative brightness, 0 (black) to 1 (white). */
export function luminance(c: string): number {
  const x = rgb(c);
  return x ? (0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]) / 255 : 0.5;
}

export const isDark = (c: string) => luminance(c) < 0.5;

/** The darkest ink the palette offers for type on light colours. */
const darkInk = (palette: string[]) => (isDark(colour(palette, 4)) ? colour(palette, 4) : "#111111");

/** The colour type is set in on the background: near white on a dark one, the ink on a light one. */
export const paper = (palette: string[]) => (isDark(colour(palette, 0)) ? "#F6F4EE" : darkInk(palette));

/** Type on a block of colour `fill`: white on dark colours, ink on light ones. */
export const typeOn = (fill: string, palette: string[]) => (isDark(fill) ? "#FFFFFF" : darkInk(palette));

/** The blocks the stage cuts between, in order: highlight, accent, paper, secondary. */
export const blocks = (palette: string[]) => [colour(palette, 3), colour(palette, 1), paper(palette), colour(palette, 2)];

/**
 * A character's colour printed with the palette, like a screen print: greys become paper or ink,
 * every other colour takes the palette colour of the nearest hue (accent, secondary or highlight),
 * darkened or lightened to keep the original's light and shade.
 */
export function poster(c: string, palette: string[]): string {
  const x = rgb(c);
  if (!x) return c;
  const [r, g, b] = x.map((v) => v / 255) as RGB;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.15 || d < 0.08) return l > 0.6 ? (isDark(colour(palette, 0)) ? "#F6F4EE" : "#FFFFFF") : l < 0.3 ? darkInk(palette) : mix(paper(palette), darkInk(palette), 0.5);
  const hue = (y: RGB): number => {
    const [R, G, B] = y.map((v) => v / 255) as RGB;
    const M = Math.max(R, G, B);
    const D = M - Math.min(R, G, B);
    if (D === 0) return 0;
    const h = M === R ? ((G - B) / D + 6) % 6 : M === G ? (B - R) / D + 2 : (R - G) / D + 4;
    return h * 60;
  };
  const h = hue(x);
  const options = [colour(palette, 1), colour(palette, 2), colour(palette, 3)];
  const distance = (o: string) => {
    const y = rgb(o);
    if (!y) return 360;
    const diff = Math.abs(hue(y) - h);
    return Math.min(diff, 360 - diff);
  };
  // A colour close to the background's brightness would vanish into it, so it only wins when nothing else is near.
  const ground = luminance(colour(palette, 0));
  const cost = (o: string) => distance(o) + (Math.abs(luminance(o) - ground) < 0.25 ? 90 : 0);
  const nearest = options.reduce((a, o) => (cost(o) < cost(a) ? o : a));
  if (l < 0.45) return mix(nearest, darkInk(palette), 0.4);
  if (l > 0.78) return mix(nearest, "#FFFFFF", 0.55);
  return nearest;
}
