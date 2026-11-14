import { AbsoluteFill } from "remotion";
import { Character, EndingMark, endingMark, endingPose, type Scene, type TextBox, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { typeOn } from "./shared.js";
import { BLEED, Stage } from "./Stage.js";

/**
 * The ending: the stage again, cutting in on the accent block, with the ending's sign top left
 * (drawn flat in the highlight colour). Without a sign the mascot takes that corner.
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const mark = endingMark(ending);
  const [box, stage] = layout(scene, palette) as [TextBox, TextBox];
  const highlight = colour(palette, 3);
  return (
    <AbsoluteFill>
      {/* Offset 1 starts the stage on the accent block. */}
      <Stage scene={scene} palette={palette} box={stage} offset={1} />
      {mark && <EndingMark kind={mark} box={box} fill={highlight} ink={typeOn(highlight, palette)} />}
      {mascot &&
        (mark ? (
          <Character rig={mascot.rig} pose={endingPose(ending)} x={840} y={stage.y - BLEED} size={150} />
        ) : (
          <Character rig={mascot.rig} pose={endingPose(ending)} x={box.x + box.w / 2} y={box.y + box.h} size={230} />
        ))}
    </AbsoluteFill>
  );
};
