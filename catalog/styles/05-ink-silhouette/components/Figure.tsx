import { FigureFrame, type FigureProps, type Part, plainPart } from "../../../../engine/remotion/kit/index.js";
import { FONT, luminance, mix, sky } from "./shared.js";

/** Parts a silhouette leaves out: soft ground shadows and blush. */
const SKIP = new Set(["shadow", "cheek"]);

/** A cloud of the demo's park: nothing but near-white puffs. */
const isCloud = (parts: Part[]) => parts.length > 0 && parts.every((p) => p.kind === "ellipse" && p.role === "prop" && luminance(p.fill) > 0.94);

/**
 * Characters and the demo's park as pure ink silhouettes: every part filled with the ink,
 * no outlines, so the parts merge into one shape. The only light is a glint in the eyes,
 * the colour of the glow behind them. Clouds become dark, half-transparent streaks.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const { ink, glow } = sky(palette);
  const glint = mix(glow, "#FFFFFF", 0.35);
  const fill = (p: Part) => (p.role === "eye-shine" ? glint : ink);
  return (
    <FigureFrame {...place}>
      <g opacity={isCloud(parts) ? 0.3 : 1}>{parts.filter((p) => !SKIP.has(p.role)).map((p, i) => plainPart(p, i, { fill, angular: true, font: FONT }))}</g>
    </FigureFrame>
  );
};
