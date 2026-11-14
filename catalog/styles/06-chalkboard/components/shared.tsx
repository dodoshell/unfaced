import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont, smoothPath } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/Caveat.ttf";

export const FONT = "Caveat";
loadFont(FONT, fontUrl, { weight: "400 700" });

/** The width of a chalk line, in pixels. */
export const CHALK = 7;

/**
 * Chalk lines "boil", as in hand-drawn animation: every BOIL frames they are drawn again
 * with a slightly different wobble, so the board never stands quite still.
 */
export const BOIL = 4;
export const useBoil = (): number => Math.floor(useCurrentFrame() / BOIL);

export type Pt = [number, number];

/** A repeatable random number in [0, 1) for a pair of integers. */
export function hash(a: number, b = 0): number {
  let h = Math.imul(Math.round(a) ^ 0x9e3779b9, 374761393) ^ Math.imul(Math.round(b) + 0x85ebca6b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** A repeatable random number in [-1, 1). */
export const wobble = (a: number, b = 0): number => hash(a, b) * 2 - 1;

/** A tileable chalk grain: mostly opaque, with small holes where the board shows through. */
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g' x='0' y='0' width='100%' height='100%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='11' stitchTiles='stitch'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 5.5 0 0 0 -1.75'/></filter>" +
  "<rect width='240' height='240' filter='url(#g)'/></svg>";
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

/** Masks an element with the chalk grain. The grain is a static image, rendered once. */
export const grain: React.CSSProperties = {
  WebkitMaskImage: GRAIN,
  maskImage: GRAIN,
  WebkitMaskSize: "240px 240px",
  maskSize: "240px 240px",
  WebkitMaskRepeat: "repeat",
  maskRepeat: "repeat",
};

/** How far the chalk has got: 0 → 1 over `duration` frames from `delay`, fast at first, slowing at the end. */
export const drawAt = (frame: number, delay = 0, duration = 18): number =>
  interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

/** {@link drawAt} at the current frame of the scene. */
export function useDraw(delay = 0, duration = 18): number {
  return drawAt(useCurrentFrame(), delay, duration);
}

/** Words written on from left to right, as a hand writes them. */
export function useWrite(delay = 0, duration = 14): React.CSSProperties {
  const t = interpolate(useCurrentFrame(), [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return t >= 1 ? {} : { clipPath: `inset(-20% ${((1 - t) * 104).toFixed(1)}% -20% -4%)` };
}

/** A small tremble for chalk lettering, new at every boil. */
export const trembleOf = (boil: number, seed: number, deg = 0): string =>
  `rotate(${(deg + wobble(seed, boil) * 0.35).toFixed(2)}deg) translate(${(wobble(seed + 1, boil) * 1.2).toFixed(1)}px, ${(wobble(seed + 2, boil) * 1.2).toFixed(1)}px)`;

/** The length of a polyline. */
export const polyLength = (pts: Pt[], closed = false): number =>
  pts.reduce((sum, p, i) => {
    const q = i + 1 < pts.length ? pts[i + 1]! : closed ? pts[0]! : undefined;
    return q ? sum + Math.hypot(q[0] - p[0], q[1] - p[1]) : sum;
  }, 0);

/** Points along a straight line drawn by hand: a little wobble, less at the ends. */
export function handLine(a: Pt, b: Pt, seed: number, amp = 3): Pt[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / 50));
  const [nx, ny] = len > 0 ? [-(b[1] - a[1]) / len, (b[0] - a[0]) / len] : [0, 0];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const k = Math.sin(t * Math.PI) * amp * wobble(seed, i);
    return [a[0] + (b[0] - a[0]) * t + nx * k, a[1] + (b[1] - a[1]) * t + ny * k] as Pt;
  });
}

/**
 * Points around an ellipse drawn by hand: slightly uneven, and when `turns` is over 1 the
 * line runs past its start, a little inside it, as a quick chalk circle does.
 */
export function handLoop(cx: number, cy: number, rx: number, ry: number, seed: number, turns = 1.1, start = -100, amp = 0.035): Pt[] {
  const n = Math.round(36 * turns);
  const [p1, p2] = [hash(seed, 1) * 6.28, hash(seed, 2) * 6.28];
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((start * Math.PI) / 180) + (i / n) * turns * Math.PI * 2;
    const r = 1 + amp * (0.6 * Math.sin(2 * a + p1) + 0.4 * Math.sin(3 * a + p2)) - 0.05 * (i / n) * (turns - 1) * 4;
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r] as Pt;
  });
}

/**
 * A polygon (or, not `closed`, a polyline) with its edges cut into steps of at most `step`
 * and wobbled by up to `amp`, so a smooth path through it keeps straight edges and corners.
 */
export function handPolygon(points: Pt[], seed: number, amp: number, step: number, closed = true): Pt[] {
  const out: Pt[] = [];
  const at = (x: number, y: number, i: number): Pt => [x + wobble(seed, i) * amp, y + wobble(seed + 5, i) * amp];
  const edges = closed ? points.length : points.length - 1;
  for (let i = 0; i < edges; i++) {
    const [p, q] = [points[i]!, points[(i + 1) % points.length]!];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    for (let k = 0; k < n; k++) out.push(at(p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n, i * 997 + k));
  }
  const last = points.at(-1);
  if (!closed && last) out.push(at(last[0], last[1], 99991));
  return out;
}

/** The points nudged by up to `amount` each, differently at every boil step. */
export const boiled = (points: Pt[], seed: number, boil: number, amount: number): Pt[] =>
  points.map(([x, y], i) => [x + wobble(seed * 977 + i, boil) * amount, y + wobble(seed * 977 + i + 4999, boil) * amount] as Pt);

/** A dash pattern (dash, gap, dash, gap...) at least `length` long, with lengths between the bounds, in units of the line's width. */
function pattern(length: number, seed: number, width: number, dash: [number, number], gap: [number, number]): number[] {
  const out: number[] = [];
  let at = 0;
  for (let i = 0; at < length + width * 40; i++) {
    const d = width * (dash[0] + hash(seed, i * 2) * (dash[1] - dash[0]));
    const g = width * (gap[0] + hash(seed, i * 2 + 1) * (gap[1] - gap[0]));
    out.push(d, g);
    at += d + g;
  }
  return out;
}

/** The dash array that shows `pattern` up to `upTo` along a path `length` long, and nothing after. */
function dashArray(dashes: number[], upTo: number, length: number): string {
  const out: number[] = [];
  let pos = 0;
  for (let i = 0; i + 1 < dashes.length && pos < upTo; i += 2) {
    const dash = Math.min(dashes[i]!, upTo - pos);
    out.push(dash);
    pos += dash;
    if (pos >= upTo) break;
    out.push(dashes[i + 1]!);
    pos += dashes[i + 1]!;
  }
  if (out.length % 2 === 0) out.push(0);
  out.push(length * 2 + 10);
  return out.map((n) => n.toFixed(1)).join(" ");
}

export interface ChalkProps {
  points: Pt[];
  closed?: boolean;
  /** How much of the line is drawn, 0–1. */
  p: number;
  colour: string;
  /** In the units of the points. */
  width?: number;
  /** Keeps the line's breaks in the same places from frame to frame. */
  seed: number;
  /** The boil step: the two passes of the stroke shift a little at each step. */
  boil?: number;
}

/**
 * A chalk line through the points: a faint dusty halo, a main stroke broken where the chalk
 * skipped, and a thinner, stippled second pass slightly off the first.
 */
export const Chalk: React.FC<ChalkProps> = ({ points, closed = false, p, colour, width = CHALK, seed, boil = 0 }) => {
  if (p <= 0 || points.length < 2) return null;
  const d = smoothPath(points, closed);
  const length = Math.max(1, polyLength(points, closed));
  const upTo = p * length;
  const shift = (k: number) => `translate(${(wobble(seed + k, boil) * width * 0.2).toFixed(2)} ${(wobble(seed + k + 7, boil) * width * 0.2).toFixed(2)})`;
  return (
    <g fill="none" stroke={colour} strokeLinejoin="round">
      <path d={d} strokeWidth={width * 2.2} strokeOpacity={0.1} strokeLinecap="round" pathLength={length} strokeDasharray={`${upTo.toFixed(1)} ${length * 2 + 10}`} />
      <path d={d} strokeWidth={width} strokeOpacity={0.92} strokeLinecap="round" pathLength={length} strokeDasharray={dashArray(pattern(length, seed, width, [14, 40], [1.25, 1.8]), upTo, length)} transform={shift(1)} />
      <path d={d} strokeWidth={width * 0.45} strokeOpacity={0.65} strokeLinecap="round" pathLength={length} strokeDasharray={dashArray(pattern(length, seed + 3, width, [1.5, 7], [0.7, 1.8]), upTo, length)} transform={shift(2)} />
    </g>
  );
};

/** A full-frame SVG layer for chalk work in screen pixels. */
export const Board: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

/** Soft chalk dust around lettering. */
export const dusty = (ink: string): React.CSSProperties => ({ textShadow: `0 0 6px ${ink}55, 0 0 1px ${ink}` });
