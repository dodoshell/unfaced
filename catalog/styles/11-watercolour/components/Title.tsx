import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, inkColour, layout } from "./layout.js";
import { blob, CHAR_WIDTH, handwriting, splatter, useDrift, useEase, WashImg, washImage } from "./shared.js";

const PAD = 120;

/**
 * The hook, handwritten in ink over a loose wash with a second colour bleeding into its
 * corner. The words are there on the first frame (the platforms' preview); the washes bloom
 * in around them.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const bloom = useEase(-12, 36);
  const paint = useDrift(16, 45);
  const ink = useDrift(12);
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const size = fitFontSize(scene.text, { w: box.w - 100, h: box.h - 120 }, 140, 60, { charWidth: CHAR_WIDTH, lineHeight: 1.08 });
  const wash = useMemo(() => {
    const [w, h] = [box.w, box.h];
    return washImage(
      w,
      h,
      PAD,
      [
        { d: blob(w / 2, h / 2, w / 2 + 10, h / 2 - 30, 21, 0.09), colour: colour(palette, 1), strength: 0.3, wobble: 34, soft: 5 },
        { d: blob(w - 90, h - 80, 210, 150, 22, 0.14), colour: colour(palette, 3), strength: 0.42, wobble: 28, soft: 4 },
        { d: blob(70, 60, 150, 110, 23, 0.14), colour: colour(palette, 2), strength: 0.34, wobble: 24, soft: 4 },
      ],
      splatter(w / 2, h / 2, w / 2 + 30, w / 2 + 110, 12, [colour(palette, 1), colour(palette, 2)], 24),
      20,
    );
  }, [box.w, box.h, palette]);
  return (
    <AbsoluteFill>
      <WashImg
        src={wash}
        x={box.x - PAD}
        y={box.y - PAD}
        w={box.w + 2 * PAD}
        h={box.h + 2 * PAD}
        palette={palette}
        style={{ opacity: 0.5 + 0.5 * bloom, transform: `${paint} scale(${0.97 + 0.03 * bloom})` }}
      />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 50px",
          boxSizing: "border-box",
          textAlign: "center",
          lineHeight: 1.08,
          transform: ink,
          ...handwriting(size, inkColour(palette)),
        }}
      >
        {scene.text}
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
