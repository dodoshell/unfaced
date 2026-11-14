import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { ball, raisedText, useFloat, useSquish } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A small clay ball circling the badge on a tilted orbit: in front on the way down, behind on the way up. */
const Moon: React.FC<{ cx: number; cy: number; radius: number; size: number; fill: string; offset: number; t: number }> = ({ cx, cy, radius, size, fill, offset, t }) => {
  const frame = useCurrentFrame();
  const angle = (frame + offset) / 28;
  const depth = Math.sin(angle);
  const scale = t * (0.8 + 0.2 * depth);
  return (
    <div
      style={{
        position: "absolute",
        left: cx + Math.cos(angle) * radius - size / 2,
        top: cy + depth * radius * 0.28 - size / 2,
        width: size,
        height: size,
        ...ball(fill),
        transform: `scale(${scale})`,
        zIndex: depth > 0 ? 2 : 0,
      }}
    />
  );
};

/** A fact: a big clay ball with the fact's number, bobbing, with two small balls in orbit. The captions carry the words. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const squish = useSquish();
  const bob = useFloat(14, 70);
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType) ?? "★";
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return (
    <AbsoluteFill>
      <Moon cx={cx} cy={cy + bob} radius={300} size={90} fill={colour(palette, 3)} offset={0} t={squish.t} />
      <Moon cx={cx} cy={cy + bob} radius={260} size={60} fill={colour(palette, 2)} offset={44} t={squish.t} />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + bob,
          width: box.w,
          height: box.h,
          ...ball(colour(palette, 1)),
          transform: squish.transform,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div style={{ ...raisedText(label.length > 1 ? 210 : 280), marginTop: 10 }}>{label}</div>
      </div>
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
