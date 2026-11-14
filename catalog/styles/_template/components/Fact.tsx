import { AbsoluteFill } from "remotion";
import { Character, factBadge, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { FONT, useEnter } from "./shared.js";

/** A fact: its number, or a star for script types that don't number their beats. The captions carry the words. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { plan } = useVideo();
  const mascot = useMascot();
  const enter = useEnter();
  const box = layout(scene, palette)[0]!;
  const label = factBadge(scene, plan.scenes, plan.scriptType) ?? "★";
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
          backgroundColor: colour(palette, 1),
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: label.length > 1 ? 200 : 260,
          transform: `scale(${0.6 + 0.4 * enter})`,
        }}
      >
        {label}
      </div>
      {mascot && <Character rig={mascot.rig} pose="talk" x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
