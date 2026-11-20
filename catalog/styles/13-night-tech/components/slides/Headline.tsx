import type React from "react";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import type { SlideBox } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";

/** The display serif headline, set on the bottom of its box so it grows upwards from the seam; the accent span in the italic and the secondary colour. */
export const Headline: React.FC<{ box: SlideBox; fitted: FittedText; accent: string }> = ({ box, fitted, accent }) => (
  <FittedLines box={box} fitted={fitted} accentColor={accent} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }} />
);
