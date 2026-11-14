import { AbsoluteFill } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { FONT, useEnter } from "./shared.js";

/** The hook in big type on a card, visible from the first frame (the platforms' preview). */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const enter = useEnter(-8);
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const size = fitFontSize(scene.text, { w: box.w - 80, h: box.h - 60 }, 100, 48);
  return (
    <AbsoluteFill>
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
          padding: "30px 40px",
          boxSizing: "border-box",
          borderRadius: 32,
          backgroundColor: "#FFFFFF",
          color: colour(palette, 4),
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.15,
          textAlign: "center",
          opacity: enter,
        }}
      >
        {scene.text}
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
