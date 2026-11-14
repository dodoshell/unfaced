import { AbsoluteFill } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { ball, cardFill, clay, FONT, useFloat, useWobble } from "./shared.js";

/** The hook: a soft clay card that lands with a squish, with two clay balls tucked behind its corners. */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  // Complete on the very first frame (the platforms' preview), then a wobble that settles.
  const card = useWobble();
  const float = useFloat(10, 90);
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const size = fitFontSize(scene.text, { w: box.w - 100, h: box.h - 80 }, 104, 50);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x - 70, top: box.y - 80 + float, width: 220, height: 220, ...ball(colour(palette, 3)), transform: card }} />
      <div style={{ position: "absolute", left: box.x + box.w - 110, top: box.y + box.h - 90 - float, width: 170, height: 170, ...ball(colour(palette, 1)), transform: card }} />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          ...clay(cardFill(palette), 64),
          transform: card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 50px",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.12,
          color: colour(palette, 4),
        }}
      >
        {scene.text}
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
