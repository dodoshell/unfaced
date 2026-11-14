import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_FONT } from "../../../../engine/remotion/core/fonts.js";
import { INK, SHADOW } from "./layout.js";

export const FONT = CAPTION_FONT;

/** Pop-in from 0.6× with a little overshoot; 0→1 over about 15 frames, starting at `delay`. */
export function usePop(delay = 0): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 160, mass: 0.7 } });
}

/** Gentle idle bob in pixels. */
export function useBob(amplitude = 10, period = 70): number {
  const frame = useCurrentFrame();
  return Math.sin((frame / period) * Math.PI * 2) * amplitude;
}

/** A flat shape with the style's ink outline and hard offset shadow. */
export const outlined = (ink: string, fill: string, radius: number | string): React.CSSProperties => ({
  backgroundColor: fill,
  border: `${INK}px solid ${ink}`,
  borderRadius: radius,
  boxShadow: `${SHADOW}px ${SHADOW}px 0 ${ink}`,
  boxSizing: "border-box",
});

/** White lettering with an ink outline, for text on coloured shapes. */
export const strokedText = (ink: string, size: number): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: size,
  color: "#FFFFFF",
  // Capped so big glyphs keep their counters and the dot of "!" stays apart.
  WebkitTextStroke: `${Math.min(16, Math.round(size / 9))}px ${ink}`,
  paintOrder: "stroke fill",
  lineHeight: 1,
});

/** An n-pointed starburst centred in a size×size SVG. */
export const Starburst: React.FC<{ size: number; points?: number; fill: string; ink: string; rotate?: number; style?: React.CSSProperties }> = ({
  size,
  points = 14,
  fill,
  ink,
  rotate = 0,
  style,
}) => {
  const c = size / 2;
  const outer = c - INK;
  const inner = outer * 0.74;
  const d = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} style={{ position: "absolute", overflow: "visible", transform: `rotate(${rotate}deg)`, ...style }}>
      <polygon points={d} fill={fill} stroke={ink} strokeWidth={INK} strokeLinejoin="round" />
    </svg>
  );
};

/** A four-pointed sparkle. */
export const Sparkle: React.FC<{ x: number; y: number; size: number; fill: string; ink: string; scale: number }> = ({ x, y, size, fill, ink, scale }) => {
  const s = size / 2;
  const d = `M ${s} 0 Q ${s * 1.12} ${s * 0.88} ${size} ${s} Q ${s * 1.12} ${s * 1.12} ${s} ${size} Q ${s * 0.88} ${s * 1.12} 0 ${s} Q ${s * 0.88} ${s * 0.88} ${s} 0 Z`;
  return (
    <svg width={size} height={size} style={{ position: "absolute", left: x - s, top: y - s, overflow: "visible", transform: `scale(${scale})` }}>
      <path d={d} fill={fill} stroke={ink} strokeWidth={6} strokeLinejoin="round" />
    </svg>
  );
};
