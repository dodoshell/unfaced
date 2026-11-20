import type React from "react";

/** Monoline digits in a 10 × 16 box, drawn rather than set, so they never depend on a font's glyphs. */
const DIGITS: Record<string, string> = {
  "0": "M5 1 C7.9 1 9 4 9 8 C9 12 7.9 15 5 15 C2.1 15 1 12 1 8 C1 4 2.1 1 5 1 Z",
  "1": "M2.6 4.2 L6 1 V15",
  "2": "M1.6 4.4 C1.7 2.2 3.2 1 5.1 1 C7.1 1 8.5 2.3 8.5 4.3 C8.5 7.4 4.6 9.8 1.4 15 H8.9",
  "3": "M1.6 2.6 C2.5 1.5 3.6 1 5 1 C7.1 1 8.3 2.3 8.3 4.1 C8.3 6.1 6.9 7.3 4.5 7.3 C7.3 7.3 8.8 8.8 8.8 11 C8.8 13.6 7.1 15 4.9 15 C3.3 15 2 14.3 1.2 13.1",
  "4": "M7 15 V1 L1 10.8 H9.4",
  "5": "M8.4 1 H2.6 L1.9 7.3 C2.8 6.6 3.9 6.2 5.1 6.2 C7.5 6.2 9 8 9 10.6 C9 13.3 7.2 15 4.8 15 C3.3 15 2 14.4 1.2 13.3",
  "6": "M7.8 1.6 C7 1.2 6.1 1 5.3 1 C2.6 1 1.2 4 1.2 8.6 C1.2 12.8 2.6 15 5.1 15 C7.4 15 8.9 13.3 8.9 10.7 C8.9 8.2 7.4 6.6 5.2 6.6 C3.3 6.6 1.9 7.8 1.3 9.6",
  "7": "M1 1 H9 L3.8 15",
  "8": "M5 7.4 C3 7.4 1.7 6.2 1.7 4.2 C1.7 2.2 3.1 1 5 1 C6.9 1 8.3 2.2 8.3 4.2 C8.3 6.2 7 7.4 5 7.4 C2.6 7.4 1.2 8.9 1.2 11.2 C1.2 13.6 2.8 15 5 15 C7.2 15 8.8 13.6 8.8 11.2 C8.8 8.9 7.4 7.4 5 7.4 Z",
  "9": "M2.2 14.4 C3 14.8 3.9 15 4.7 15 C7.4 15 8.8 12 8.8 7.4 C8.8 3.2 7.4 1 4.9 1 C2.6 1 1.1 2.7 1.1 5.3 C1.1 7.8 2.6 9.4 4.8 9.4 C6.7 9.4 8.1 8.2 8.7 6.4",
};

/** The shapes in a 24 × 24 box. */
const PATHS = {
  check: "M5 12.5 L10 17.5 L19.5 7",
  cross: "M7 7 L17 17 M17 7 L7 17",
  arrow: "M4 12 H20 M14 6 L20 12 L14 18",
  bell: "M6 16.5 V11 C6 7.6 8.6 5 12 5 C15.4 5 18 7.6 18 11 V16.5 L19.5 18 H4.5 Z M10 20.5 C10.4 21.4 11.1 22 12 22 C12.9 22 13.6 21.4 14 20.5 M12 3 V5",
} as const;

export type IconName = keyof typeof PATHS | "number";

export interface IconProps {
  name: IconName;
  /** For "number": the number to draw (its digits side by side). */
  n?: number;
  /** The icon's height in px (a number's digits are 16:10). */
  size: number;
  color: string;
  /** Line width in px; by default about a twelfth of the size. */
  stroke?: number;
  /** Rotation in degrees, for an arrow that points down. */
  rotate?: number;
  style?: React.CSSProperties;
}

/**
 * One of Night tech's drawn icons: ✓ ✗ → and a bell as monoline strokes, numbers as drawn
 * digits. Text glyphs are never used for them: the style's serif has none, and a brand font
 * might not either.
 */
export const Icon: React.FC<IconProps> = ({ name, n = 0, size, color, stroke, rotate, style }) => {
  const common = { fill: "none", stroke: color, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "number") {
    const digits = String(n).split("");
    const w = digits.length * 10 + (digits.length - 1) * 2;
    return (
      <svg width={(size * w) / 16} height={size} viewBox={`0 0 ${w} 16`} style={{ display: "block", overflow: "visible", ...style }}>
        {digits.map((d, i) => (
          <path key={i} d={DIGITS[d]} transform={`translate(${i * 12} 0)`} strokeWidth={stroke ? (stroke * 16) / size : 1.5} {...common} />
        ))}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible", ...(rotate && { transform: `rotate(${rotate}deg)` }), ...style }}>
      <path d={PATHS[name]} strokeWidth={stroke ? (stroke * 24) / size : 2} {...common} />
    </svg>
  );
};

/** An icon inside a circle: filled with `fill` (or outlined in `ring`), the icon centred in it. */
export const Badge: React.FC<{ x: number; y: number; size: number; icon: IconName; n?: number; color: string; fill?: string; ring?: string }> = ({ x, y, size, icon, n, color, fill, ring }) => {
  const inner = icon === "number" ? size * 0.42 : size * 0.58;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        boxSizing: "border-box",
        ...(fill && { backgroundColor: fill }),
        ...(ring && { border: `${Math.max(1.5, size / 28)}px solid ${ring}` }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} {...(n !== undefined && { n })} size={inner} color={color} stroke={Math.max(2, size / 22)} />
    </div>
  );
};
