import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, type Pose, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import { colour, factBadge, factNumber, layout } from "./layout.js";
import { outlined, Sparkle, strokedText, useBob, usePop } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A fact: a big numbered badge that pops in and bobs, with twinkling sparkles. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const pop = usePop();
  const bob = useBob(14);
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const twinkle = (offset: number) => 0.75 + 0.25 * Math.sin((frame + offset) / 7);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + bob,
          width: box.w,
          height: box.h,
          ...outlined(ink, colour(palette, 1), "50%"),
          transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label ? (
          <div style={{ ...strokedText(ink, label.length > 1 ? 200 : 280), marginTop: 20 }}>{label}</div>
        ) : (
          <Sparkle x={box.w / 2} y={box.h / 2} size={230} fill={colour(palette, 3)} ink={ink} scale={1} />
        )}
      </div>
      <Sparkle x={box.x - 20} y={box.y + 60} size={110} fill={colour(palette, 3)} ink={ink} scale={pop * twinkle(0)} />
      <Sparkle x={box.x + box.w + 30} y={box.y + 140} size={80} fill={colour(palette, 2)} ink={ink} scale={pop * twinkle(10)} />
      <Sparkle x={box.x + box.w - 10} y={box.y + box.h + 20} size={120} fill={colour(palette, 3)} ink={ink} scale={pop * twinkle(20)} />
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
