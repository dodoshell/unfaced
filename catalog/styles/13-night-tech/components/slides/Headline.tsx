import type React from "react";
import { liftedOn } from "../../../../../engine/remotion/core/contrast.js";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import type { SlideBox } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";

/**
 * The display serif headline, set on the bottom of its box so it grows upwards from the seam; the
 * accent span in the italic and the secondary colour (lifted towards white if a brand's secondary
 * would not read on the ground under it).
 */
export const Headline: React.FC<{ box: SlideBox; fitted: FittedText; accent: string; align?: "left" | "center"; top?: boolean }> = ({ box, fitted, accent, align, top }) => (
  <FittedLines
    box={box}
    fitted={fitted}
    accentColor={liftedOn(box.on, accent, 3)}
    {...(align && { align })}
    style={{ display: "flex", flexDirection: "column", justifyContent: top ? "flex-start" : "flex-end" }}
  />
);
