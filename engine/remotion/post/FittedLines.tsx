import type React from "react";
import type { FittedText } from "../../src/post/fitText.js";
import type { SlideBox } from "../styles/registry.js";
import { slideFont } from "./slideFonts.js";

export interface FittedLinesProps {
  /** The box the text was fitted to: its place, role (font), colour, tracking and case are drawn from it. */
  box: SlideBox;
  /** The lines and size fitText chose for `box`; drawn exactly as they are, never wrapped again. */
  fitted: FittedText;
  /** The accent span's colour; the box's own colour otherwise. Its font is always the accent role's. */
  accentColor?: string;
  align?: "left" | "center" | "right";
  /** Extra CSS for the box (it is positioned absolutely at the box's x, y, w and h). */
  style?: React.CSSProperties;
}

/**
 * A slide box's precomputed lines, at the box, one per row with `white-space: pre`, in the font
 * of the box's role, with the accent span in the accent font. Everything the fit measured with
 * (role, tracking, case) comes from the same `box`, so the drawing cannot drift from the fit.
 */
export const FittedLines: React.FC<FittedLinesProps> = ({ box, fitted, accentColor, align, style }) => {
  const lineHeight = fitted.lines.length > 0 ? fitted.height / fitted.lines.length : fitted.size;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        fontFamily: slideFont(box.role),
        fontSize: fitted.size,
        lineHeight: `${lineHeight}px`,
        color: box.color,
        ...(box.tracking !== undefined && { letterSpacing: `${box.tracking}em` }),
        ...(box.upper && { textTransform: "uppercase" as const }),
        ...(align && { textAlign: align }),
        ...style,
      }}
    >
      {fitted.lines.map((line, i) => {
        const { accent } = line;
        return (
          <div key={i} style={{ whiteSpace: "pre" }}>
            {accent ? (
              <>
                {line.text.slice(0, accent.start)}
                <span style={{ fontFamily: slideFont("accent"), color: accentColor ?? box.color }}>{line.text.slice(accent.start, accent.end)}</span>
                {line.text.slice(accent.end)}
              </>
            ) : (
              line.text
            )}
          </div>
        );
      })}
    </div>
  );
};
