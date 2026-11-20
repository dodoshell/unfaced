import type React from "react";
import type { FittedText } from "../../src/post/fitText.js";

export interface FittedLinesProps {
  /** The lines and size fitText chose; drawn exactly as they are, never wrapped again. */
  fitted: FittedText;
  color: string;
  /** CSS font family, such as slideFont("display"). */
  font: string;
  accentColor?: string;
  accentFont?: string;
  /** The box's tracking and case, as given to fitText. */
  tracking?: number;
  upper?: boolean;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
}

/** A text box's precomputed lines, one per row with `white-space: pre`, the accent span in its own font and colour. */
export const FittedLines: React.FC<FittedLinesProps> = ({ fitted, color, font, accentColor, accentFont, tracking, upper, align, style }) => {
  const lineHeight = fitted.lines.length > 0 ? fitted.height / fitted.lines.length : fitted.size;
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: fitted.size,
        lineHeight: `${lineHeight}px`,
        color,
        ...(tracking !== undefined && { letterSpacing: `${tracking}em` }),
        ...(upper && { textTransform: "uppercase" as const }),
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
                <span style={{ fontFamily: accentFont ?? font, color: accentColor ?? color }}>{line.text.slice(accent.start, accent.end)}</span>
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
