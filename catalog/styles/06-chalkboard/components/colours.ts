// Chalk colours from the page palette. Pure, like layout.ts, so tests can call it without rendering.
import style from "../style.json";
import { colour } from "./layout.js";

const HEX = /^#[0-9a-f]{6}$/i;
const channels = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mixes colour `a` towards `b` by `t` (0–1). Colours that aren't #RRGGBB give `b`. */
export function mix(a: string, b: string, t: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return b;
  const [x, y] = [channels(a), channels(b)];
  return `#${x.map((c, i) => Math.round(c + (y[i]! - c) * t).toString(16).padStart(2, "0")).join("")}`;
}

const luminance = (hex: string): number => {
  if (!HEX.test(hex)) return 0;
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

/** The WCAG contrast ratio of two colours, from 1 to 21. */
export const contrast = (a: string, b: string): number => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (l1! + 0.05) / (l2! + 0.05);
};

/** Whether the board is light (a light page palette): chalk is then dark, like marker on a whiteboard. */
export const lightBoard = (palette: string[]): boolean => luminance(colour(palette, 0)) > 0.35;

/** Chalk for a light board. */
const DARK_CHALK = "#22302A";

/**
 * The chalk colour for a palette role, kept readable on the board: an ink with less than 3:1
 * contrast turns into white or dark chalk, whichever reads better, and a coloured chalk too close
 * to the board is mixed 55 % of the way towards the ink.
 */
export function chalk(palette: string[], role: 1 | 2 | 3 | 4): string {
  const board = colour(palette, 0);
  const white = style.defaultPalette[4]!;
  let ink = colour(palette, 4);
  if (contrast(ink, board) < 3) ink = contrast(DARK_CHALK, board) > contrast(white, board) ? DARK_CHALK : white;
  if (role === 4) return ink;
  const c = colour(palette, role);
  return contrast(c, board) < 1.8 ? mix(c, ink, 0.55) : c;
}

/** A character's colour as pale chalk: mixed 45 % of the way towards the chalk ink. */
export const pastel = (c: string, ink: string): string => mix(c, ink, 0.45);
