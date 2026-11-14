// Colour arithmetic for flat-shaded facets. Colours that aren't #RRGGBB pass through.
const HEX = /^#[0-9a-f]{6}$/i;

type RGB = [number, number, number];

const rgb = (hex: string): RGB => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const hex = ([r, g, b]: RGB): string => `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;

/** `a` mixed towards `b` by `t` (0..1). */
export function mix(a: string, b: string, t: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return a;
  const [p, q] = [rgb(a), rgb(b)];
  return hex([0, 1, 2].map((i) => p[i]! + (q[i]! - p[i]!) * t) as RGB);
}

/** Lighter towards white (amount > 0) or darker towards black (amount < 0). */
export const tone = (c: string, amount: number): string => mix(c, amount > 0 ? "#FFFFFF" : "#000000", Math.abs(amount));

/** Relative brightness, 0 (black) … 1 (white). */
export function brightness(c: string): number {
  if (!HEX.test(c)) return 0.5;
  const [r, g, b] = rgb(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * A facet's colour under flat shading: `light` 0 is the facet turned away (deep shade),
 * 1 its base colour, above 1 a glint towards white.
 */
export const lit = (c: string, light: number): string => (light >= 1 ? tone(c, Math.min(0.6, (light - 1) * 0.9)) : tone(c, -(1 - light) * 0.62));
