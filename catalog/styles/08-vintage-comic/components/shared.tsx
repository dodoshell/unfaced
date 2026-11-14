import type React from "react";
import { useId } from "react";
import { Freeze, useCurrentFrame } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/Bangers.ttf";
import { BANGERS, colour } from "./layout.js";

export const FONT = "Bangers";
loadFont(FONT, fontUrl, { weight: "400" });

/** How far the colour plates sit from the ink plate, in pixels: a slightly off-register print. */
export const MISREGISTER = { x: 6, y: 4 };
/** Outline width of panels, balloons and bursts. */
export const LINE = 8;

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (hex: string): [number, number, number] => {
  if (!HEX.test(hex)) return [128, 128, 128];
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `a` mixed `t` of the way towards `b`. */
export function mix(a: string, b: string, t: number): string {
  const [p, q] = [rgb(a), rgb(b)];
  return `#${p.map((c, i) => Math.round(c + (q[i]! - c) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Perceived brightness, 0 (black) to 1 (white). */
export const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** The printed page's colours from the page palette. */
export interface Inks {
  paper: string;
  /** The red plate in the default palette: fact dots, the outro burst, the floor screen. */
  accent: string;
  /** The blue plate: the sky screen, extrusions, the mascot's panels. */
  secondary: string;
  /** The yellow plate: the title panel, the caption box, the fact burst. */
  highlight: string;
  /** Marks printed straight on the paper (the page's panel border, focus lines): the palette's ink. */
  ink: string;
  /** Outlines of filled shapes and the lettering inside them: always dark, since the fills are light. */
  line: string;
  /** Speech balloons and caption panels: near white, whatever the paper. */
  balloon: string;
}

export function inks(palette: string[]): Inks {
  const paper = colour(palette, 0);
  const ink = colour(palette, 4);
  return {
    paper,
    accent: colour(palette, 1),
    secondary: colour(palette, 2),
    highlight: colour(palette, 3),
    ink,
    line: luminance(ink) < 0.4 ? ink : "#17120E",
    balloon: luminance(paper) < 0.5 ? "#F8F3E6" : mix(paper, "#FFFFFF", 0.78),
  };
}

/** A unique id for SVG defs (patterns, masks) of one component on the page. */
export const useSvgId = (name: string): string => `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** A Ben-Day dot screen: dots of one colour on a 45° grid, `pitch` pixels apart. */
const Dots: React.FC<{ id: string; colour: string; pitch?: number; radius?: number; angle?: number }> = ({ id, colour: c, pitch = 18, radius = 5.5, angle = 45 }) => (
  <pattern id={id} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
    <circle cx={pitch / 2} cy={pitch / 2} r={radius} fill={c} />
  </pattern>
);

/** Comic lettering: Bangers in capitals, tight lines. */
export const lettering = (colour: string, size: number): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 400,
  fontSize: size,
  lineHeight: BANGERS.lineHeight,
  letterSpacing: "0.03em",
  color: colour,
  textTransform: "uppercase",
});

/** The frame drawn on twos: everything inside moves every other frame, like limited animation. */
export const OnTwos: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return <Freeze frame={Math.floor(frame / 2) * 2}>{children}</Freeze>;
};

/** Which of three hand-drawn variants a "boiling" shape shows: a new one every 4 frames. */
export const useBoil = (): number => Math.floor(useCurrentFrame() / 4) % 3;

/**
 * A slam entrance `delay` frames into the scene: the shape lands from 1.3× in 4 frames with no
 * bounce, then shakes for a few frames from the impact. Returns its scale and shake in pixels.
 */
export function useSlam(delay = 0): { shown: boolean; scale: number; shake: number } {
  const f = useCurrentFrame() - delay;
  if (f < 0) return { shown: false, scale: 1.3, shake: 0 };
  const scale = f >= 4 ? 1 : 1.3 - 0.3 * (f / 4);
  const shake = f >= 4 && f < 12 ? (f % 4 < 2 ? 1 : -1) * (12 - f) * 0.9 : 0;
  return { shown: true, scale, shake };
}

/** A small pseudo-random number in [0, 1), the same for the same seed. */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A jagged explosion outline around (cx, cy): `points` spikes between radius `inner` and `outer`, varied by `seed`. */
export function burstPath(cx: number, cy: number, outer: number, inner: number, points: number, seed: number, squash = 1): string {
  const d: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const spike = i % 2 === 0;
    const r = (spike ? outer : inner) * (spike ? 0.82 + 0.3 * rand(seed + i) : 0.9 + 0.14 * rand(seed + i * 3));
    const a = ((i + (spike ? 0.15 * (rand(seed + i * 7) - 0.5) : 0)) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    d.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r * squash).toFixed(1)}`);
  }
  return `M ${d.join(" L ")} Z`;
}

/**
 * An explosion burst printed off-register: the flat colour and its dot screen sit a few
 * pixels off the ink outline. It "boils" (a new hand-drawn outline every 4 frames).
 */
export const Burst: React.FC<{ cx: number; cy: number; outer: number; inner: number; points: number; fill: string; dots: string; line: string; seed: number; squash?: number }> = ({
  cx,
  cy,
  outer,
  inner,
  points,
  fill,
  dots,
  line,
  seed,
  squash = 1,
}) => {
  const id = useSvgId("burst");
  const boil = useBoil();
  const d = burstPath(cx, cy, outer, inner, points, seed + boil * 0.37, squash);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <Dots id={id} colour={dots} pitch={20} radius={5.2} />
      </defs>
      <g transform={`translate(${MISREGISTER.x} ${MISREGISTER.y})`}>
        <path d={d} fill={fill} />
        <path d={d} fill={`url(#${id})`} />
      </g>
      <path d={d} fill="none" stroke={line} strokeWidth={LINE} strokeLinejoin="round" />
    </svg>
  );
};

/** Thin wedges radiating from (cx, cy), starting about `inner` pixels out; `set` picks one of two hand-drawn sets. */
export function focusPath(cx: number, cy: number, inner: number, set: number, n = 46): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = ((i + set * 0.5 + 0.4 * rand(i + set * 50)) / n) * Math.PI * 2;
    const w = 0.012 + 0.016 * rand(i * 5 + set);
    const r0 = inner * (1 + 0.25 * rand(i * 9 + set * 13));
    const p = (r: number, da: number) => `${(cx + Math.cos(a + da) * r).toFixed(1)} ${(cy + Math.sin(a + da) * r).toFixed(1)}`;
    d += `M ${p(r0, 0)} L ${p(1500, w)} L ${p(1500, -w)} Z `;
  }
  return d;
}

/** Which of the two sets of focus lines shows: they flicker every 6 frames. */
export const useFlicker = (): number => Math.floor(useCurrentFrame() / 6) % 2;

/** Focus lines across the page, radiating from (cx, cy). They fade out above the captions (y 1180), so the words stay clear. */
export const FocusLines: React.FC<{ cx: number; cy: number; inner: number; colour: string; opacity?: number }> = ({ cx, cy, inner, colour: c, opacity = 0.85 }) => {
  const set = useFlicker();
  const id = useSvgId("focus");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${id}-fade`} x1={0} y1={0} x2={0} y2={1920} gradientUnits="userSpaceOnUse">
          <stop offset={1000 / 1920} stopColor="#FFFFFF" />
          <stop offset={1170 / 1920} stopColor="#000000" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect width={1080} height={1920} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <path d={focusPath(cx, cy, inner, set)} fill={c} opacity={opacity} mask={`url(#${id}-mask)`} />
    </svg>
  );
};

/** Where the mascot's inset panel sits in the fact and outro scenes, clear of the text boxes. */
export const MASCOT_PANEL = { x: 600, y: 905, w: 330, h: 250 };

/**
 * Lettering with a colour fill printed off-register under an ink outline, and an optional
 * hard extrusion in a second colour: big numbers and signs.
 */
export const PrintedText: React.FC<{ text: string; size: number; fill: string; line: string; extrude?: string; style?: React.CSSProperties }> = ({ text, size, fill, line, extrude, style }) => {
  const base: React.CSSProperties = { ...lettering(fill, size), lineHeight: 1, position: "absolute", left: 0, top: 0, width: "100%", textAlign: "center" };
  const stroke = Math.max(6, Math.round(size / 22));
  return (
    <div style={{ position: "relative", width: "100%", height: size, ...style }}>
      {extrude && <div style={{ ...base, color: extrude, WebkitTextStroke: `${stroke}px ${extrude}`, transform: `translate(${size / 18}px, ${size / 18}px)` }}>{text}</div>}
      <div style={{ ...base, transform: `translate(${MISREGISTER.x}px, ${MISREGISTER.y}px)` }}>{text}</div>
      <div style={{ ...base, color: "transparent", WebkitTextStroke: `${stroke}px ${line}` }}>{text}</div>
    </div>
  );
};

/** A rectangular panel or caption box: off-register colour fill, optional dot screen, ink border. */
export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  line: string;
  dots?: string;
  dotRadius?: number;
  rotate?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, fill, line, dots, dotRadius = 3.2, rotate = 0, children, style }) => {
  const id = useSvgId("panel");
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rotate}deg)`, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {dots && (
          <defs>
            <Dots id={id} colour={dots} pitch={16} radius={dotRadius} />
          </defs>
        )}
        <g transform={`translate(${MISREGISTER.x} ${MISREGISTER.y})`}>
          <rect x={0} y={0} width={w} height={h} fill={fill} />
          {dots && <rect x={0} y={0} width={w} height={h} fill={`url(#${id})`} />}
        </g>
        <rect x={LINE / 2} y={LINE / 2} width={w - LINE} height={h - LINE} fill="none" stroke={line} strokeWidth={LINE} />
      </svg>
      {children}
    </div>
  );
};

/** A small panel framing the mascot in the fact and outro scenes, with a light dot screen behind it. */
export const MascotPanel: React.FC<{ c: Inks }> = ({ c }) => <Panel {...MASCOT_PANEL} fill={c.balloon} dots={c.secondary} dotRadius={2.6} line={c.line} rotate={2} />;
