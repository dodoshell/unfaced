import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, type TextBox, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { CAP, fitLines } from "./kinetic.js";
import { colour, layout } from "./layout.js";
import { Line, paper, slam } from "./shared.js";
import { BLEED, Stage } from "./Stage.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A fact: its number in outline capitals top left, then the stage with the key word of each phrase. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const { plan } = useVideo();
  const [badge, stage] = layout(scene, palette) as [TextBox, TextBox];
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const number = label ? fitLines(label.padStart(2, "0"), badge, { maxLines: 1, maxSize: 260 })[0] : undefined;
  const place = Math.max(0, plan.scenes.findIndex((s) => s.beatId === scene.beatId));
  const s = slam(frame, 0);
  const ink = paper(palette);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${s})`, transformOrigin: `${badge.x}px ${badge.y}px` }}>
        {number ? (
          <Line line={number} x={badge.x} y={badge.y + (badge.h - number.size * CAP) / 2} stroke={ink} />
        ) : (
          // Script types that don't number their beats get a solid arrow pointing at the stage.
          <svg width={badge.h} height={badge.h} viewBox="0 0 100 100" style={{ position: "absolute", left: badge.x, top: badge.y }}>
            <polygon points="34,6 66,6 66,56 88,56 50,96 12,56 34,56" fill={colour(palette, 1)} />
          </svg>
        )}
      </div>
      <Stage scene={scene} palette={palette} box={stage} offset={place} />
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={840} y={stage.y - BLEED} size={150} />}
    </AbsoluteFill>
  );
};
