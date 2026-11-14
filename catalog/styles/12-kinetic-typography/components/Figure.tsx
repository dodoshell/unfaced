import { FigureFrame, type FigureProps, type Part, plainPart } from "../../../../engine/remotion/kit/index.js";
import { colour } from "./layout.js";
import { FONT, mix, paper, poster } from "./shared.js";

/**
 * Characters and the demo's park printed with the palette, like a two-colour screen print: flat
 * fills, no outlines, every colour moved to the palette colour of the nearest hue, the ground a
 * block of the secondary colour. The ground shadow is a flat bar, and parts on the far side are
 * knocked back towards the background.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const bg = colour(palette, 0);
  const far = (p: Part) => p.role === "leg-far" || p.role === "arm-far" || p.role === "ear-far";
  // Big ground pieces (the demo's lawn) are a block of the secondary colour, so the scene reads as blocks.
  const ground = (p: Part) => p.kind === "shape" && Math.max(...p.points.map(([x]) => x)) - Math.min(...p.points.map(([x]) => x)) > 600;
  const fill = (p: Part): string => {
    if (p.role === "shadow") return mix(bg, paper(palette), 0.18);
    if (p.role === "eye-shine") return "#FFFFFF";
    if (p.role === "cheek") return mix(colour(palette, 1), "#FFFFFF", 0.35);
    if (p.kind === "mark") return colour(palette, 3);
    if (ground(p)) return colour(palette, 2);
    const printed = poster(p.kind === "stroke" ? p.colour : p.fill, palette);
    return far(p) ? mix(printed, bg, 0.4) : printed;
  };
  return (
    <FigureFrame {...place}>
      {parts.map((p, i) =>
        p.role === "shadow" && p.kind === "ellipse" ? (
          <rect key={i} x={p.cx - p.rx} y={p.cy - 1.5} width={p.rx * 2} height={3} fill={fill(p)} />
        ) : (
          plainPart(p, i, { fill, angular: true, font: FONT })
        ),
      )}
    </FigureFrame>
  );
};
