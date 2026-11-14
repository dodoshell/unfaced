import { FigureFrame, type FigureProps, plainPart } from "../../../../engine/remotion/core/character/svg.js";
import type { Part } from "../../../../engine/remotion/core/character/types.js";
import { colour } from "./layout.js";
import { FONT } from "./shared.js";

const LINE_ROLES = new Set(["eye", "nose", "brow"]);

/** Characters in flat cartoon: flat fills, a thick ink outline and the style's hard offset shadow. */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const ink = colour(palette, 4);
  const inked = (p: Part) => ((p.kind === "stroke" && p.line) || p.kind === "mark" || LINE_ROLES.has(p.role) ? ink : undefined);
  const solid = parts.filter((p) => p.role !== "shadow" && p.kind !== "mark");
  return (
    <FigureFrame {...place}>
      <g transform="translate(3.2 3.2)">{solid.map((p, i) => plainPart(p, i, { fill: () => ink, outline: { width: 2.2, colour: ink }, angular: true }))}</g>
      {parts.map((p, i) => plainPart(p, i, { fill: inked, outline: { width: 2.2, colour: ink }, angular: true, font: FONT }))}
    </FigureFrame>
  );
};
