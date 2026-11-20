import type React from "react";
import { Icon, type IconName } from "./Icon.js";

export interface ChipProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The chip's face. */
  fill: string;
  /** A 1.5 px outline; none for a filled button. */
  stroke?: string;
  /** An icon `pad` inside the chip, before the text (or after it, for a button's arrow). */
  icon?: { name: IconName; color: string; size: number; pad: number; side?: "left" | "right" };
  children?: React.ReactNode;
}

/**
 * A rounded pill: the outlined ✓ and ✗ chips, the filled button and the steps' pills. It draws
 * the shape and its icon only; the text goes on top as its own fitted box (or as `children` in a
 * post's own slide).
 */
export const Chip: React.FC<ChipProps> = ({ x, y, w, h, fill, stroke, icon, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      borderRadius: h / 2,
      backgroundColor: fill,
      ...(stroke && { border: `1.5px solid ${stroke}` }),
    }}
  >
    {icon && (
      <div style={{ position: "absolute", top: (h - icon.size) / 2 - (stroke ? 1.5 : 0), ...(icon.side === "right" ? { right: icon.pad - (stroke ? 1.5 : 0) } : { left: icon.pad - (stroke ? 1.5 : 0) }) }}>
        <Icon name={icon.name} size={icon.size} color={icon.color} stroke={Math.max(2, icon.size / 9)} />
      </div>
    )}
    {children}
  </div>
);
