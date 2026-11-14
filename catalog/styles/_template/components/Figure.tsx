import { FigureFrame, type FigureProps, plainPart } from "../../../../engine/remotion/kit/index.js";
import { colour } from "./layout.js";
import { FONT } from "./shared.js";

/** Characters and the demo's park: flat fills with a thin ink outline. */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const ink = colour(palette, 4);
  return <FigureFrame {...place}>{parts.map((p, i) => plainPart(p, i, { outline: { width: 1.5, colour: ink }, font: FONT }))}</FigureFrame>;
};
