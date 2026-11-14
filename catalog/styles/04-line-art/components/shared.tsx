import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/Inter.ttf";

export const FONT = "Inter";
loadFont(FONT, fontUrl, { weight: "100 900" });

/** The style's one line weight, in pixels: every outline, rule and figure is drawn with it. */
export const LINE = 5;

/** How far a pen has got: 0 → 1 over `duration` frames from `delay`, easing in and out. */
export const drawAt = (frame: number, delay = 0, duration = 24): number =>
  interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

/** {@link drawAt} at the current frame of the scene. */
export function useDraw(delay = 0, duration = 24): number {
  return drawAt(useCurrentFrame(), delay, duration);
}

/** Dash settings that show the first `p` (0–1) of a path, so it is drawn on as `p` grows. */
export const drawn = (p: number): React.SVGProps<SVGPathElement> =>
  p >= 1 ? { pathLength: 1 } : { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p };

/** A path in the style's pen: one weight, round ends, no fill, drawn on as `p` goes from 0 to 1. */
export const Pen: React.FC<{ d: string; p: number; colour: string; width?: number; transform?: string }> = ({ d, p, colour, width = LINE, transform }) =>
  p <= 0 ? null : <path d={d} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" transform={transform} {...drawn(p)} />;

/** A full-frame SVG layer for pen work in screen pixels. */
export const Sheet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

const f = (n: number) => n.toFixed(2);

/** An ellipse as a path that starts at the top and runs clockwise. */
export const ellipsePath = (cx: number, cy: number, rx: number, ry: number): string =>
  `M ${f(cx)} ${f(cy - ry)} A ${f(rx)} ${f(ry)} 0 1 1 ${f(cx)} ${f(cy + ry)} A ${f(rx)} ${f(ry)} 0 1 1 ${f(cx)} ${f(cy - ry)} Z`;

/** A rectangle as a path that starts at the top left and runs clockwise. */
export const rectPath = (x: number, y: number, w: number, h: number): string => `M ${f(x)} ${f(y)} H ${f(x + w)} V ${f(y + h)} H ${f(x)} Z`;

/** Words fade up into place, a little after the pen work around them. */
export function useSettle(delay = 0, duration = 14): React.CSSProperties {
  const t = useDraw(delay, duration);
  return { opacity: t, transform: `translateY(${(1 - t) * 16}px)` };
}
