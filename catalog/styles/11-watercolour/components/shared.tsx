import type React from "react";
import { continueRender, delayRender, Easing, Img, interpolate, useCurrentFrame } from "remotion";
import { loadFont, smoothPath } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/ShadowsIntoLightTwo.ttf";
import { colour } from "./layout.js";

export const FONT = "Shadows Into Light Two";
loadFont(FONT, fontUrl, { weight: "400" });

/** Shadows Into Light Two's average letter width as a share of its size, for fitFontSize. */
export const CHAR_WIDTH = 0.46;

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

export const luma = (hex: string): number => {
  if (!HEX.test(hex)) return 128;
  const [r, g, b] = rgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isDark = (hex: string): boolean => luma(hex) < 128;

/** Whether the page is painted on a dark sheet, where washes can't glaze (multiply) and are laid on normally instead. */
export const darkSheet = (palette: string[]): boolean => isDark(colour(palette, 0));

/** How washes combine with what is under them: glazed (multiplied) on light paper, laid on normally on a dark sheet. */
const glaze = (palette: string[]): React.CSSProperties["mixBlendMode"] => (darkSheet(palette) ? "normal" : "multiply");

// Washes. Their soft, wet edges come from SVG filters (displacement, blur, an edge-darkening
// difference and granulation), which are slow to redo every frame, so each wash is painted
// once into an image and only faded or moved afterwards.

/** A blob of paint around (cx, cy): an ellipse whose radius wanders by about `wander` of itself. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, wander = 0.1): string {
  const r = rng(seed);
  const waves = [2, 3, 5].map((k) => ({ k, a: wander * (0.3 + r() * 0.7) * (k === 2 ? 1 : 0.6), p: r() * Math.PI * 2 }));
  const n = 40;
  const pts = Array.from({ length: n }, (_, i): Pt => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.k * a + w.p), 0);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return smoothPath(pts, true);
}

/** A brush stroke from (x1, y) to (x2, y), `h` thick, ragged at both ends. */
export function stroke(x1: number, x2: number, y: number, h: number, seed: number): string {
  const r = rng(seed);
  const n = 10;
  const top: Pt[] = Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n, y - h / 2 + (r() - 0.5) * h * 0.18]);
  const bottom: Pt[] = Array.from({ length: n + 1 }, (_, i) => [x2 - ((x2 - x1) * i) / n, y + h / 2 + (r() - 0.5) * h * 0.18]);
  const end = (x: number, dir: 1 | -1): Pt[] => [[x + dir * h * (0.2 + r() * 0.25), y - h * 0.15], [x + dir * h * (0.1 + r() * 0.2), y + h * 0.2]];
  return smoothPath([...top, ...end(x2, 1), ...bottom, ...end(x1, -1).reverse()], true);
}

interface Wash {
  /** The wash's shape as an SVG path, in the image's own pixels. */
  d: string;
  colour: string;
  /** How much pigment: 0 (none) to 1 (opaque). */
  strength: number;
  /** How far the edge wanders, in pixels. */
  wobble?: number;
  /** How soft the edge is, in pixels. */
  soft?: number;
}

/** Paint splatter: small round drops. */
interface Drop {
  x: number;
  y: number;
  r: number;
  colour: string;
  strength: number;
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * One wash's filter: the shape's edge is pushed around by noise and softened; a difference of
 * two blurs finds the band just inside the edge, which is darkened, as pigment pools where a
 * wet wash dries; slow noise makes the pigment uneven and fine noise granulates it.
 */
function washFilter(id: string, seed: number, wobble: number, soft: number): string {
  const s = (k: number) => (seed * 17 + k) % 9973;
  return (
    `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${(0.9 / Math.max(wobble, 4)) * 0.6}" numOctaves="3" seed="${s(1)}" result="warp"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="warp" scale="${wobble}" xChannelSelector="R" yChannelSelector="G" result="shape"/>` +
    `<feGaussianBlur in="shape" stdDeviation="${soft}" result="soft"/>` +
    `<feGaussianBlur in="soft" stdDeviation="${soft * 3 + 3}" result="wide"/>` +
    `<feComposite in="soft" in2="wide" operator="arithmetic" k2="1" k3="-1" result="band"/>` +
    `<feColorMatrix in="band" type="matrix" values="0.62 0 0 0 0 0 0.62 0 0 0 0 0 0.62 0 0 0 0 0 1.7 0" result="edge"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${s(2)}" result="flow"/>` +
    `<feColorMatrix in="flow" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.3 0 0 0 0.2" result="density"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="${s(3)}" result="g"/>` +
    `<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.9 0 0 0.45" result="granules"/>` +
    `<feComposite in="soft" in2="density" operator="in" result="body"/>` +
    `<feComposite in="body" in2="granules" operator="in" result="grained"/>` +
    `<feMerge><feMergeNode in="grained"/><feMergeNode in="edge"/></feMerge>` +
    `</filter>`
  );
}

/** An image (as a data URL) of washes and drops in a w×h box, with `pad` px around for the soft edges. Later washes glaze over earlier ones. */
export function washImage(w: number, h: number, pad: number, washes: Wash[], drops: Drop[] = [], seed = 1): string {
  const defs: string[] = [];
  const body: string[] = [];
  washes.forEach((wash, i) => {
    const wobble = wash.wobble ?? 18;
    const soft = wash.soft ?? 2.5;
    defs.push(washFilter(`w${i}`, seed * 13 + i, wobble, soft));
    body.push(`<path d="${wash.d}" fill="${wash.colour}" fill-opacity="${wash.strength}" filter="url(#w${i})" style="mix-blend-mode:multiply"/>`);
  });
  if (drops.length > 0) {
    defs.push(`<filter id="d" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.8"/></filter>`);
    for (const d of drops) body.push(`<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="${d.colour}" fill-opacity="${d.strength}" filter="url(#d)"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * pad}" height="${h + 2 * pad}" viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" style="isolation:isolate"><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
  return svgUrl(svg);
}

/** A spray of drops around (cx, cy), between `from` and `to` px away. */
export function splatter(cx: number, cy: number, from: number, to: number, count: number, colours: string[], seed: number): Drop[] {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = r() * Math.PI * 2;
    const dist = from + r() * (to - from);
    return { x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist, r: 2 + r() ** 2 * 9, colour: colours[i % colours.length]!, strength: 0.45 + r() * 0.35 };
  });
}

/** A sheet of cold-press watercolour paper: the background colour with the paper's tooth lit from the top left. */
export function paperSheet(w: number, h: number, bg: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="p" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="11" result="n"/>` +
    `<feDiffuseLighting in="n" surfaceScale="2.2" diffuseConstant="1" lighting-color="#ffffff" result="lit"><feDistantLight azimuth="225" elevation="58"/></feDiffuseLighting>` +
    `<feComponentTransfer in="lit" result="tooth"><feFuncR type="linear" slope="0.22" intercept="0.8"/><feFuncG type="linear" slope="0.22" intercept="0.8"/><feFuncB type="linear" slope="0.22" intercept="0.8"/></feComponentTransfer>` +
    `<feBlend in="SourceGraphic" in2="tooth" mode="multiply"/>` +
    `</filter><rect width="100%" height="100%" fill="${bg}" filter="url(#p)"/></svg>`;
  return svgUrl(svg);
}

/** The size of {@link PIGMENT_TILE}, in pixels. */
export const PIGMENT_SIZE = 640;

/**
 * Uneven pigment as a seamless transparent tile: slow blooms a little darker and lighter than
 * the wash, and fine granules. Figures change every frame, so they lay this static tile over
 * their washes instead of running the wash filter's noise again.
 */
export const PIGMENT_TILE = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PIGMENT_SIZE}" height="${PIGMENT_SIZE}"><filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="3" seed="8" stitchTiles="stitch" result="flow"/>` +
    `<feColorMatrix in="flow" type="matrix" values="0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.12 -0.45 0 0 0 0.21" result="dark"/>` +
    `<feColorMatrix in="flow" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.55 0 0 0 -0.27" result="light"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="1" seed="9" stitchTiles="stitch" result="g"/>` +
    `<feColorMatrix in="g" type="matrix" values="0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.12 0 -0.5 0 0 0.27" result="granules"/>` +
    `<feMerge><feMergeNode in="dark"/><feMergeNode in="light"/><feMergeNode in="granules"/></feMerge>` +
    `</filter><rect width="100%" height="100%" filter="url(#t)"/></svg>`,
);

// Figures draw the tile inside their own SVG, where the renderer doesn't wait for images: decode it before the first frame.
if (typeof Image !== "undefined") {
  const handle = delayRender("Decoding the watercolour pigment");
  const img = new Image();
  img.onload = () => continueRender(handle);
  img.onerror = () => continueRender(handle);
  img.src = PIGMENT_TILE;
}

/** A painted image placed with its top left at (x, y), glazed over what is below it. */
export const WashImg: React.FC<{ src: string; x: number; y: number; w: number; h: number; palette: string[]; style?: React.CSSProperties }> = ({ src, x, y, w, h, palette, style }) => (
  <Img src={src} style={{ position: "absolute", left: x, top: y, width: w, height: h, mixBlendMode: glaze(palette), willChange: "transform, opacity", pointerEvents: "none", ...style }} />
);

// Calm motion.

/** 0 → 1 over `duration` frames from `delay`, easing in and out, with no overshoot. */
export function useEase(delay = 0, duration = 24): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

/** A slow float in pixels. */
export function useFloat(amplitude = 6, period = 150, phase = 0): number {
  const frame = useCurrentFrame();
  return Math.sin(((frame + phase) / period) * Math.PI * 2) * amplitude;
}

/** Frames for one turn of a {@link useDrift}. */
const DRIFT_PERIOD = 90;

/**
 * A drift round a small oval, as `translate()`: gentle, but at an even speed that never stops,
 * unlike a float, which rests at each end. Ink needs to move about 0.7 px a frame for the
 * checks to see the picture move (they call half a second without motion frozen).
 */
export function useDrift(radius: number, phase = 0, period = DRIFT_PERIOD): string {
  const frame = useCurrentFrame();
  const a = ((frame + phase) / period) * Math.PI * 2;
  return `translate(${(Math.cos(a) * radius).toFixed(2)}px, ${(Math.sin(a) * radius * 0.85).toFixed(2)}px)`;
}

/** Handwriting in ink: Shadows Into Light Two is thin, so it gets a stroke of its own colour to read on a phone; lines are balanced so no word is left alone. */
export const handwriting = (size: number, ink: string): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  color: ink,
  WebkitTextStroke: `${Math.max(1, Math.round(size / 55))}px ${ink}`,
  paintOrder: "stroke fill",
  textWrap: "balance",
});
