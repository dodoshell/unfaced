import type React from "react";
import { continueRender, delayRender, Img, spring, useCurrentFrame } from "remotion";
import { Character, type CharacterProps, loadFont, type Rect } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/PatrickHand.ttf";
import { colour } from "./layout.js";

export const FONT = "Patrick Hand";
loadFont(FONT, fontUrl, { weight: "400" });

/** Patrick Hand's average letter width as a share of its size, for fitFontSize. */
export const CHAR_WIDTH = 0.44;

export type Pt = [number, number];

// Randomness. Everything is seeded, so any frame renders the same on its own.

/** A number in [0, 1) from two integers; the same inputs always give the same number. */
function hash(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** A seeded stream of numbers in [0, 1). */
export function rng(seed: number): () => number {
  let n = 0;
  return () => hash(seed, n++);
}

// Stop motion: the scenes are shot at 12 poses a second, so every pose holds for two or three frames.

export const STEP = 30 / 12;

/** The current pose number and the frame it was shot at; animate with `t`, not the frame. */
export function useStopMotion(): { step: number; t: number } {
  const step = Math.floor(useCurrentFrame() / STEP);
  return { step, t: step * STEP };
}

/** 0 → 1 with a little overshoot, `delay` frames after the held frame `t`. */
export const stepSpring = (t: number, fps: number, delay = 0): number => spring({ frame: t - delay, fps, config: { damping: 11, stiffness: 120, mass: 0.8 } });

/** A character posed once per exposure: it holds each pose for two or three frames, like a paper puppet. */
export const Puppet: React.FC<CharacterProps> = (props) => {
  const frame = useCurrentFrame();
  const held = Math.round(Math.floor(frame / STEP) * STEP);
  return <Character {...props} offset={(props.offset ?? 0) + held - frame} />;
};

/** The small nudge a hand gives a paper piece between two exposures, in pixels and degrees. */
export function nudge(seed: number, step: number, px = 1.6, deg = 0.5): { x: number; y: number; r: number } {
  const w = (k: number) => hash(seed, step * 3 + k) * 2 - 1;
  return { x: w(0) * px, y: w(1) * px, r: w(2) * deg };
}

export const nudged = (n: { x: number; y: number; r: number }, extra = ""): string => `translate(${n.x.toFixed(2)}px, ${n.y.toFixed(2)}px) rotate(${n.r.toFixed(3)}deg) ${extra}`.trim();

// Colour.

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mixes two #RRGGBB colours; anything else passes through as `a`. */
export function mix(a: string, b: string, t: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return a;
  const [x, y] = [rgb(a), rgb(b)];
  const c = x.map((v, i) => Math.round(v + (y[i]! - v) * t));
  return `#${((c[0]! << 16) | (c[1]! << 8) | c[2]!).toString(16).padStart(6, "0")}`;
}

const luma = (hex: string): number => {
  if (!HEX.test(hex)) return 128;
  const [r, g, b] = rgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isDark = (hex: string): boolean => luma(hex) < 128;

/** The paper text sits on: white card stock under dark ink, a dark sheet under light ink. */
export const cardPaper = (palette: string[]): string => (isDark(colour(palette, 4)) ? "#FFFDF7" : mix(colour(palette, 0), "#FFFFFF", 0.12));

/** Lettering for a coloured piece: white paper, or on a pale piece the darkest of the ink, the background and a near black. */
export function onPaper(fill: string, palette: string[]): string {
  if (luma(fill) < 170) return "#FFFDF7";
  const [ink, bg] = [colour(palette, 4), colour(palette, 0)];
  return isDark(ink) ? ink : isDark(bg) ? bg : "#1E1A14";
}

// Cut and torn outlines, in the piece's own pixels.

/** A w×h rectangle cut by hand with scissors: a few straight snips per side that wander inwards by up to `rough` px. */
function cutRect(w: number, h: number, seed: number, rough = 6): Pt[] {
  const r = rng(seed);
  const corners: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const pts: Pt[] = [];
  corners.forEach((a, side) => {
    const b = corners[(side + 1) % 4]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [nx, ny] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const snips = Math.max(1, Math.round(len / (90 + r() * 70)));
    for (let k = 0; k < snips; k++) {
      const t = k === 0 ? 0 : (k + (r() - 0.5) * 0.4) / snips;
      const inset = k === 0 ? rough * (0.2 + r() * 0.8) : r() * rough;
      pts.push([a[0] + (b[0] - a[0]) * t + nx * inset, a[1] + (b[1] - a[1]) * t + ny * inset]);
    }
  });
  return pts;
}

/** A circle cut with scissors: short straight snips, each a little in or out. */
export function cutCircle(cx: number, cy: number, radius: number, seed: number, rough = 0.025): Pt[] {
  const r = rng(seed);
  const n = Math.max(14, Math.min(72, Math.round((2 * Math.PI * radius) / 22)));
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + (r() - 0.5) * 0.5) / n) * Math.PI * 2;
    const k = radius * (1 - rough + r() * rough * 2);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });
}

/**
 * A torn edge from a to b, without b: small teeth riding on a slow wander, pushed off the
 * straight line along its left normal (pass the edge so that the paper lies on the right).
 */
export function tornEdge(a: Pt, b: Pt, seed: number, { teeth = 8, depth = 3, wander = 5 } = {}): Pt[] {
  const r = rng(seed);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nx, ny] = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  const n = Math.max(2, Math.round(len / teeth));
  const p1 = r() * 6;
  const p2 = r() * 6;
  const f1 = 1.5 + r() * 2;
  const f2 = 4 + r() * 4;
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;
    const off = i === 0 ? 0 : wander * (0.6 * Math.sin(t * f1 * Math.PI + p1) + 0.4 * Math.sin(t * f2 * Math.PI + p2)) + (r() - 0.5) * 2 * depth;
    return [a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off] as Pt;
  });
}

/** A strip torn off a sheet: cut straight along the top and bottom, torn at both ends. Returns the outline and its white rim. */
export function tornStrip(w: number, h: number, seed: number): { outline: Pt[]; rim: Pt[] } {
  const r = rng(seed);
  const end = { teeth: 6, depth: 2.5, wander: 3 };
  const right = tornEdge([w - 9, 0], [w - 9, h], seed + 1, end);
  const left = tornEdge([9, h], [9, 0], seed + 2, end);
  const top: Pt[] = [[9, r() * 4], [w * (0.4 + r() * 0.2), r() * 5]];
  const bottom: Pt[] = [[w - 9, h - r() * 4], [w * (0.4 + r() * 0.2), h - r() * 5]];
  const outline = [...top, ...right, ...bottom, ...left];
  const out = (pts: Pt[], dx: number) => pts.map(([x, y], i) => [x + dx * (0.6 + Math.abs(Math.sin(i * 0.9 + seed))), y] as Pt);
  return { outline, rim: [...top, ...out(right, 5), ...bottom, ...out(left, -5)] };
}

/** A cloud cut from a w×h sheet: round bumps along the top, a straight cut along the bottom. */
export function cloud(w: number, h: number, seed: number): Pt[] {
  const r = rng(seed);
  const bumps = [0.38, 0.62, 0.5, 0.34].map((k, i) => ({ cx: w * (0.17 + i * 0.22) + (r() - 0.5) * 12, rad: h * k * (0.95 + r() * 0.1), cy: h * 0.8 }));
  const top: Pt[] = [];
  for (let x = 0; x <= w; x += 9) {
    const y = Math.min(h - 6, ...bumps.map((b) => (Math.abs(x - b.cx) < b.rad ? b.cy - Math.sqrt(b.rad ** 2 - (x - b.cx) ** 2) : h)));
    top.push([x, Math.max(2, y + (r() - 0.5) * 2)]);
  }
  return [...top, [w, h], [0, h]];
}

/** Five-pointed star centred on (cx, cy). */
export function star(cx: number, cy: number, outer: number, seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + (r() - 0.5) * 0.08;
    const k = (i % 2 === 0 ? outer : outer * 0.45) * (0.94 + r() * 0.12);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });
}

/** A scalloped circle, like a paper rosette: `bumps` round lobes around (cx, cy). */
export function rosette(cx: number, cy: number, outer: number, bumps: number, seed: number): Pt[] {
  const r = rng(seed);
  const n = bumps * 8;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = outer * (0.86 + 0.14 * Math.sqrt(Math.abs(Math.sin((a * bumps) / 2)))) * (0.99 + r() * 0.02);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });
}

const HEART: Pt[] = [
  [0, -0.3],
  [0.18, -0.52],
  [0.42, -0.58],
  [0.6, -0.44],
  [0.66, -0.2],
  [0.56, 0.06],
  [0.3, 0.34],
  [0, 0.6],
  [-0.3, 0.34],
  [-0.56, 0.06],
  [-0.66, -0.2],
  [-0.6, -0.44],
  [-0.42, -0.58],
  [-0.18, -0.52],
];

/** A heart cut from folded paper: symmetric, with straight snips. */
export function heart(cx: number, cy: number, size: number, seed: number): Pt[] {
  const r = rng(seed);
  return HEART.map(([x, y]) => [cx + x * size + (r() - 0.5) * size * 0.02, cy + y * size + (r() - 0.5) * size * 0.02] as Pt);
}

const path = (pts: Pt[]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

// Paper pieces as images. Their texture and shadows go through SVG filters, which are slow to
// redo on every frame, so each piece is drawn once into an image and only moved afterwards.

interface Piece {
  outline: Pt[];
  fill: string;
  /** The torn white core along the edge: an outline drawn underneath, a little larger. */
  rim?: Pt[];
  /** A soft drop shadow under the piece. */
  shadow?: { dx: number; dy: number; blur: number; opacity: number };
  /** Fibre and grain on the paper; 0 for none. */
  grain?: number;
}

/** A soft shadow for a piece lifted `lift` px off the paper below it. */
export const lifted = (lift: number, opacity = 0.3) => ({ dx: lift * 0.35, dy: lift * 0.7, blur: lift * 0.8, opacity });

/** The white core of the paper, showing along torn edges. */
export const RIM = "#FBF7EC";

/** An SVG image (as a data URL) of paper pieces in a w×h box, with `pad` px around for the shadows. */
export function paperImage(w: number, h: number, pad: number, pieces: Piece[], seed = 1): string {
  const defs: string[] = [];
  const body: string[] = [];
  pieces.forEach((p, i) => {
    if (p.shadow) {
      defs.push(`<filter id="s${i}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${p.shadow.blur.toFixed(1)}"/></filter>`);
      body.push(`<path d="${path(p.outline)}" transform="translate(${p.shadow.dx.toFixed(1)} ${p.shadow.dy.toFixed(1)})" fill="#1E1A14" opacity="${p.shadow.opacity}" filter="url(#s${i})"/>`);
    }
    if (p.rim) body.push(`<path d="${path(p.rim)}" fill="${RIM}"/>`);
    const grain = p.grain ?? 1;
    if (grain > 0) defs.push(`<filter id="g${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${texture(seed * 7 + i, grain, true)}</filter>`);
    body.push(`<path d="${path(p.outline)}" fill="${p.fill}"${grain > 0 ? ` filter="url(#g${i})"` : ""}/>`);
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * pad}" height="${h + 2 * pad}" viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}"><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
  return svgUrl(svg);
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Filter primitives for the paper's surface: faint dark grain, soft blotches where the pulp
 * was thicker and pale fibres along the zero lines of a slow turbulence. With `onSource`
 * they are laid over the filtered shape and clipped to it; without, they stand alone.
 */
function texture(seed: number, grain: number, onSource: boolean): string {
  const s = (k: number) => (seed * 31 + k) % 9973;
  const alpha = (row: string, k: number, c: number) => `${row.replace("K", (k * grain).toFixed(3))} ${(c * grain).toFixed(3)}`;
  const stitch = onSource ? "" : ` stitchTiles="stitch"`;
  return (
    `<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="1" seed="${s(1)}"${stitch} result="n"/>` +
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0 0.08 ${alpha("0 0 K 0", -0.55, 0.29)}" result="grain"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="${s(2)}"${stitch} result="m"/>` +
    `<feColorMatrix in="m" type="matrix" values="0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0 0.08 ${alpha("0 K 0 0", -0.2, 0.1)}" result="mottle"/>` +
    `<feTurbulence type="turbulence" baseFrequency="0.02 0.028" numOctaves="3" seed="${s(3)}"${stitch} result="f"/>` +
    `<feColorMatrix in="f" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${alpha("K 0 0 0", -7, 0.42)}" result="fibres"/>` +
    (onSource
      ? `<feMerge result="tex"><feMergeNode in="SourceGraphic"/><feMergeNode in="mottle"/><feMergeNode in="grain"/><feMergeNode in="fibres"/></feMerge><feComposite in="tex" in2="SourceAlpha" operator="in"/>`
      : `<feMerge><feMergeNode in="mottle"/><feMergeNode in="grain"/><feMergeNode in="fibres"/></feMerge>`)
  );
}

/** The size of {@link GRAIN_TILE}, in pixels. */
export const GRAIN_SIZE = 256;

/** The paper's surface alone, as a seamless transparent tile: for figures, which change every frame. */
export const GRAIN_TILE = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAIN_SIZE}" height="${GRAIN_SIZE}"><filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${texture(5, 0.8, false)}</filter><rect width="100%" height="100%" filter="url(#t)"/></svg>`,
);

// Figures draw the tile inside their own SVG, where the renderer doesn't wait for images: decode it before the first frame.
if (typeof Image !== "undefined") {
  const handle = delayRender("Decoding the paper grain");
  const img = new Image();
  img.onload = () => continueRender(handle);
  img.onerror = () => continueRender(handle);
  img.src = GRAIN_TILE;
}

/** A paper image drawn over `box`, its padding hanging out on every side. */
export const PaperImg: React.FC<{ src: string; w: number; h: number; pad: number; style?: React.CSSProperties }> = ({ src, w, h, pad, style }) => (
  <Img src={src} style={{ position: "absolute", left: -pad, top: -pad, width: w + 2 * pad, height: h + 2 * pad, pointerEvents: "none", ...style }} />
);

/** A strip of masking tape, torn at both ends. */
export function tapeImage(w: number, h: number, seed: number): string {
  const right = tornEdge([w, 0], [w, h], seed, { teeth: 5, depth: 2.5, wander: 1.5 }).map(([x, y]) => [x - 4, y] as Pt);
  const left = tornEdge([0, h], [0, 0], seed + 1, { teeth: 5, depth: 2.5, wander: 1.5 }).map(([x, y]) => [x + 4, y] as Pt);
  const outline: Pt[] = [[4, 0], ...right, [w - 4, h], ...left];
  return paperImage(w, h, 12, [{ outline, fill: "#EFE3BE", shadow: lifted(3, 0.18), grain: 0.6 }], seed);
}

/** A card of `fill` paper with scissor-cut edges and a soft shadow, filling the box it is placed in. */
export const cardImage = (w: number, h: number, fill: string, seed: number, lift = 12): string =>
  paperImage(w, h, 40, [{ outline: cutRect(w, h, seed), fill, shadow: lifted(lift) }], seed);

/** Where in a box a child sits: absolute, filling it. */
export const fill = (box: Rect): React.CSSProperties => ({ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h });
