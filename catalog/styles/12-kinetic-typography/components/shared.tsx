import type React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import antonUrl from "../fonts/Anton.ttf";
import { CAP, type TypeLine } from "./kinetic.js";

export { blocks, isDark, mix, paper, poster, typeOn } from "./colours.js";

/** Anton, a tall condensed grotesque: the only face in this style. */
export const FONT = "Anton";
loadFont(FONT, antonUrl);

/**
 * One line of capitals, drawn to exactly `line.width` pixels wide (SVG textLength), its capitals
 * filling a box `line.size * CAP` tall whose top left is (x, y).
 */
export const Line: React.FC<{ line: TypeLine; x: number; y: number; fill?: string; stroke?: string; style?: React.CSSProperties }> = ({ line, x, y, fill = "none", stroke, style }) => {
  const h = line.size * CAP;
  return (
    <svg width={line.width} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible", ...style }}>
      <text
        x={0}
        y={h}
        fontFamily={FONT}
        fontSize={line.size}
        textLength={line.width}
        lengthAdjust="spacingAndGlyphs"
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? Math.max(2, line.size / 60) : undefined}
        strokeLinejoin="round"
      >
        {line.text.toUpperCase()}
      </text>
    </svg>
  );
};

/** A slam: the type lands from 1.3× and settles in four frames, starting `at`. 1 before it. */
export function slam(frame: number, at: number): number {
  const f = frame - at;
  return f < 0 ? 1 : ([1.3, 1.12, 0.97, 1.01][f] ?? 1);
}

/** A short punch, for a word that is already on stage when the voice says it. */
export function punch(frame: number, at: number): number {
  const f = frame - at;
  return f < 0 ? 1 : ([1.09, 1.04, 0.99][f] ?? 1);
}

/** A slow push-in, growing by `amount` over `frames`: the type never stands still between cuts. */
export function usePush(amount: number, frames: number): number {
  const frame = useCurrentFrame();
  return 1 + amount * Math.min(1, Math.max(0, frame) / Math.max(1, frames));
}
