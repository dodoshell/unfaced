import { useMemo } from "react";
import { AbsoluteFill, Img } from "remotion";
import { colour } from "./layout.js";
import { blob, paperSheet, splatter, useDrift, useFloat, WashImg, washImage } from "./shared.js";

const W = 1080;
const H = 1920;
/** How far the corner washes wander, in pixels. */
const DRIFT = 18;

/**
 * A sheet of cold-press watercolour paper with loose washes bleeding into each other in
 * two corners, clear of the text column and the captions' middle. The washes drift and
 * breathe very slowly.
 */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const driftTop = useDrift(DRIFT, 0, 240);
  const driftBottom = useDrift(DRIFT, 120, 240);
  const breathe = 0.93 + 0.07 * useFloat(1, 300, 75);
  const images = useMemo(() => {
    const [accent, secondary, highlight] = [colour(palette, 1), colour(palette, 2), colour(palette, 3)];
    return {
      paper: paperSheet(W, H, colour(palette, 0)),
      top: washImage(
        700,
        520,
        60,
        [
          { d: blob(200, 150, 330, 230, 3, 0.12), colour: accent, strength: 0.3, wobble: 30, soft: 4 },
          { d: blob(470, 110, 190, 140, 4, 0.14), colour: secondary, strength: 0.32, wobble: 26, soft: 4 },
          { d: blob(120, 330, 150, 110, 5, 0.16), colour: highlight, strength: 0.38, wobble: 22, soft: 3 },
        ],
        splatter(420, 300, 60, 200, 9, [accent, secondary], 6),
        2,
      ),
      bottom: washImage(
        820,
        560,
        60,
        [
          { d: blob(560, 330, 330, 220, 7, 0.12), colour: highlight, strength: 0.38, wobble: 30, soft: 4 },
          { d: blob(760, 170, 170, 200, 8, 0.15), colour: accent, strength: 0.28, wobble: 26, soft: 4 },
          { d: blob(250, 470, 260, 140, 9, 0.12), colour: secondary, strength: 0.3, wobble: 26, soft: 4 },
        ],
        splatter(330, 230, 40, 180, 8, [secondary, accent], 10),
        3,
      ),
    };
  }, [palette]);
  return (
    <AbsoluteFill style={{ backgroundColor: colour(palette, 0), overflow: "hidden" }}>
      <Img src={images.paper} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <WashImg src={images.top} x={-260 - 60} y={-120 - 60} w={820} h={640} palette={palette} style={{ transform: driftTop, opacity: breathe }} />
      <WashImg src={images.bottom} x={W - 760 - 60} y={H - 520 - 60} w={940} h={680} palette={palette} style={{ transform: driftBottom, opacity: breathe }} />
    </AbsoluteFill>
  );
};
