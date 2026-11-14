import { AbsoluteFill } from "remotion";
import { Character, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { FONT, useEnter } from "./shared.js";

/** The ending: a round mark. The engine draws the ending's sign (a question, a follow button) on top unless the style does. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const enter = useEnter();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          borderRadius: "50%",
          backgroundColor: colour(palette, 2),
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 260,
          transform: `scale(${enter})`,
        }}
      >
        !
      </div>
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
