import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/Nunito.ttf";
import { colour } from "./layout.js";

export const FONT = "Nunito";
loadFont(FONT, fontUrl, { weight: "200 1000" });

const HEX = /^#[0-9a-f]{6}$/i;

/** Mixes a colour towards white (amount > 0) or black (amount < 0). Colours that aren't #RRGGBB pass through. */
export function shade(hex: string, amount: number): string {
  if (!HEX.test(hex)) return hex;
  const n = Number.parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * a);
  const [r, g, b] = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const isDark = (hex: string): boolean => {
  if (!HEX.test(hex)) return false;
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 128;
};

/** The colour of the cards text sits on: near white under dark ink, a lifted background under light ink. */
export const cardFill = (palette: string[]): string => (isDark(colour(palette, 4)) ? shade(colour(palette, 0), 0.8) : shade(colour(palette, 0), 0.14));

/** A rounded clay slab: lit from above, darker underneath, with a soft contact shadow. */
export const clay = (fill: string, radius: number | string): React.CSSProperties => ({
  borderRadius: radius,
  background: `linear-gradient(165deg, ${shade(fill, 0.4)} 0%, ${fill} 42%, ${shade(fill, -0.1)} 100%)`,
  boxShadow: `inset 0 -16px 28px ${shade(fill, -0.22)}, inset 0 14px 22px ${shade(fill, 0.55)}, 0 28px 46px rgba(40, 30, 60, 0.22), 0 6px 12px rgba(40, 30, 60, 0.12)`,
  boxSizing: "border-box",
});

/** A clay ball: a highlight up and to the left, the far side in shadow. */
export const ball = (fill: string): React.CSSProperties => ({
  borderRadius: "50%",
  background: `radial-gradient(circle at 34% 28%, ${shade(fill, 0.6)} 0%, ${fill} 40%, ${shade(fill, -0.28)} 100%)`,
  boxShadow: "0 30px 50px rgba(40, 30, 60, 0.24), 0 8px 14px rgba(40, 30, 60, 0.12)",
});

/** Soft white lettering with a little depth, for text on coloured clay. */
export const raisedText = (size: number): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1,
  color: "#FFFFFF",
  textShadow: "0 6px 0 rgba(40, 30, 60, 0.18), 0 14px 24px rgba(40, 30, 60, 0.25)",
});

/**
 * A squash-and-stretch entrance, `delay` frames into the scene: the shape grows with a soft
 * overshoot and is wider and flatter while it overshoots, like clay landing.
 */
export function useSquish(delay = 0): { t: number; transform: string } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 110, mass: 0.8 } });
  const give = (t - 1) * 0.35;
  return { t, transform: `scale(${t * (1 + give)}, ${t * (1 - give)})` };
}

/**
 * For shapes that must be complete on the first frame (the hook is the platforms' preview):
 * at rest at frame 0, then a soft clay wobble that settles within about a second.
 */
export function useWobble(): string {
  const frame = useCurrentFrame();
  const give = 0.05 * Math.sin(frame / 3.2) * Math.exp(-frame / 12);
  return `scale(${1 + give}, ${1 - give})`;
}

/** A slow float in pixels. */
export function useFloat(amplitude = 12, period = 80, phase = 0): number {
  const frame = useCurrentFrame();
  return Math.sin(((frame + phase) / period) * Math.PI * 2) * amplitude;
}
