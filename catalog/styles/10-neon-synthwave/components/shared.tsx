import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import monotonUrl from "../fonts/Monoton.ttf";
import orbitronUrl from "../fonts/Orbitron.ttf";
import { alpha, core } from "./colours.js";

export { alpha, core, luminance, mix, neon, night } from "./colours.js";

/** Monoton, the neon sign face: the hook and the numbers. */
export const DISPLAY = "Monoton";
/** Orbitron: list rows, headers and the figures' marks. */
export const TEXT = "Orbitron";
loadFont(DISPLAY, monotonUrl);
loadFont(TEXT, orbitronUrl, { weight: "400 900" });

/**
 * Lettering lit like a neon tube: a white-hot core and a glow of `c` in four layers.
 * `chroma` adds the red/cyan fringe of an old screen, offset by that many pixels.
 */
export function glowText(c: string, size: number, chroma?: { left: string; right: string; offset: number }): React.CSSProperties {
  const k = Math.max(0.5, Math.min(1.6, size / 100));
  const glow = [`0 0 ${2 * k}px ${c}`, `0 0 ${8 * k}px ${c}`, `0 0 ${22 * k}px ${alpha(c, 0.85)}`, `0 0 ${46 * k}px ${alpha(c, 0.55)}`];
  const fringe = chroma ? [`${-chroma.offset}px 0 0 ${alpha(chroma.left, 0.7)}`, `${chroma.offset}px 0 0 ${alpha(chroma.right, 0.7)}`] : [];
  return { color: core(c), textShadow: [...fringe, ...glow].join(", ") };
}

/** A neon tube along an SVG path: two soft glow strokes, the coloured tube and its hot core. */
export const Tube: React.FC<{ d: string; colour: string; width: number; fill?: string; opacity?: number; dash?: string }> = ({ d, colour: c, width, fill = "none", opacity = 1, dash }) => {
  const line = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeDasharray: dash };
  return (
    <g opacity={opacity}>
      {fill !== "none" && <path d={d} fill={fill} />}
      <path d={d} {...line} stroke={c} strokeWidth={width * 5.5} opacity={0.12} />
      <path d={d} {...line} stroke={c} strokeWidth={width * 2.6} opacity={0.3} />
      <path d={d} {...line} stroke={c} strokeWidth={width} />
      <path d={d} {...line} stroke={core(c)} strokeWidth={width * 0.4} />
    </g>
  );
};

/** SVG path of a circle. */
export const circlePath = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

/** SVG path of a rounded rectangle. */
export function roundRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const q = Math.min(r, w / 2, h / 2);
  return `M ${x + q} ${y} H ${x + w - q} A ${q} ${q} 0 0 1 ${x + w} ${y + q} V ${y + h - q} A ${q} ${q} 0 0 1 ${x + w - q} ${y + h} H ${x + q} A ${q} ${q} 0 0 1 ${x} ${y + h - q} V ${y + q} A ${q} ${q} 0 0 1 ${x + q} ${y} Z`;
}

/** How bright a tube is while it strikes, frame by frame: on, off, flutter, then steady. */
const STRIKE = [0.85, 0.1, 0.9, 0.35, 1, 1, 0.55, 1];

/** A neon tube igniting `delay` frames into the scene: 0 before, a flicker for eight frames, then 1. */
export function useIgnite(delay = 0): number {
  const f = useCurrentFrame() - delay;
  return f < 0 ? 0 : (STRIKE[f] ?? 1);
}

/**
 * The faint buzz of a lit tube: brightness between 0.93 and 1, never the same two frames running,
 * with a short dip now and then. `seed` keeps tubes from buzzing in step.
 */
export function useHum(seed = 0): number {
  const f = useCurrentFrame() + seed * 17;
  const noise = Math.sin(f * 12.9898 + seed) * 43758.5453;
  const dip = f % 97 === 50 || f % 97 === 52 ? 0.7 : 1;
  return (0.93 + 0.07 * (noise - Math.floor(noise))) * dip;
}

/** A soft entrance from `from`× to full size over about 12 frames, starting at `delay`. */
export function useGrow(delay = 0, from = 0.85): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 170, mass: 0.6 } });
  return from + (1 - from) * t;
}

/** A slow float in pixels. */
export function useFloat(amplitude = 10, period = 80, phase = 0): number {
  const frame = useCurrentFrame();
  return Math.sin(((frame + phase) / period) * Math.PI * 2) * amplitude;
}
