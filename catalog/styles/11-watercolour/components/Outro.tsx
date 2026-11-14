import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Character, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { blob, splatter, useDrift, useEase, useFloat, WashImg, washImage } from "./shared.js";

const PAD = 130;

/** A heart of `size` px centred on (cx, cy), as an SVG path. */
function heartPath(cx: number, cy: number, size: number): string {
  const p = (x: number, y: number) => `${(cx + x * size).toFixed(1)} ${(cy + y * size).toFixed(1)}`;
  return `M${p(0, -0.22)} C${p(0.02, -0.5)} ${p(0.5, -0.58)} ${p(0.52, -0.2)} C${p(0.53, 0.08)} ${p(0.2, 0.3)} ${p(0, 0.5)} C${p(-0.2, 0.3)} ${p(-0.53, 0.08)} ${p(-0.52, -0.2)} C${p(-0.5, -0.58)} ${p(-0.02, -0.5)} ${p(0, -0.22)} Z`;
}

/**
 * The ending: a heart painted wet in wet over a pale round wash, breathing slowly, with a
 * spray of drops. The engine draws the ending's sign above it.
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const bloom = useEase(0, 30);
  const heartBloom = useEase(8, 26);
  const breathe = useFloat(0.02, 120);
  const groundDrift = useDrift(14, 45);
  const heartDrift = useDrift(18);
  const box = layout(scene, palette)[0]!;
  const R = box.w / 2;
  const images = useMemo(
    () => ({
      ground: washImage(
        box.w,
        box.h,
        PAD,
        [
          { d: blob(R, R, R + 20, R, 41, 0.08), colour: colour(palette, 3), strength: 0.34, wobble: 30, soft: 5 },
          { d: blob(R - 150, R - 140, 120, 100, 42, 0.14), colour: colour(palette, 1), strength: 0.3, wobble: 22, soft: 4 },
        ],
        splatter(R, R, R + 20, R + 120, 16, [colour(palette, 1), colour(palette, 2)], 43),
        40,
      ),
      heart: washImage(box.w, box.h, PAD, [{ d: heartPath(R, R + 10, 300), colour: colour(palette, 2), strength: 0.72, wobble: 16, soft: 3 }], [], 44),
    }),
    [box.w, box.h, R, palette],
  );
  const place = { x: box.x - PAD, y: box.y - PAD, w: box.w + 2 * PAD, h: box.h + 2 * PAD };
  return (
    <AbsoluteFill>
      <WashImg src={images.ground} {...place} palette={palette} style={{ opacity: bloom, transform: `${groundDrift} scale(${0.95 + 0.05 * bloom})` }} />
      <WashImg src={images.heart} {...place} palette={palette} style={{ opacity: heartBloom, transform: `${heartDrift} scale(${0.92 + 0.08 * heartBloom + breathe})` }} />
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
