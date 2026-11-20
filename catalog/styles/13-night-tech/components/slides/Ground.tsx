import type React from "react";
import { useId } from "react";
import { AbsoluteFill } from "remotion";
import type { PostFormat } from "../../../../../engine/src/post/types.js";
import { colours, DOTS, GLOW, SIZE } from "./tokens.js";

/** `#RRGGBB` at `alpha`, for gradients. */
const rgba = (hex: string, alpha: number): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * The night ground: the background colour, the accent's soft glow low on the right (the same
 * numbers groundUnder measures text against) and a faint dot grid lined up with the margins.
 */
export const Ground: React.FC<{ palette: string[]; format: PostFormat }> = ({ palette, format }) => {
  const c = colours(palette);
  const id = `night-dots-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const { width, height } = format;
  const glow = `radial-gradient(ellipse ${GLOW.rx * width}px ${GLOW.ry * height}px at ${GLOW.cx * width}px ${GLOW.cy * height}px, ${GLOW.stops
    .map(([d, s]) => `${rgba(c.accent, s)} ${d * 100}%`)
    .join(", ")})`;
  const offset = (SIZE.side % DOTS.every) - DOTS.size / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: c.ground }}>
      <AbsoluteFill style={{ backgroundImage: glow }} />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={id} x={offset} y={offset} width={DOTS.every} height={DOTS.every} patternUnits="userSpaceOnUse">
            <circle cx={DOTS.size / 2} cy={DOTS.size / 2} r={DOTS.size / 2} fill={c.ink} fillOpacity={DOTS.opacity} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
