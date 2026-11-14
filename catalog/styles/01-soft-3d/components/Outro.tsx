import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { ball, useFloat, useSquish } from "./shared.js";

const HEART = "M100,178 C40,136 12,104 12,68 C12,38 36,16 64,16 C80,16 92,24 100,38 C108,24 120,16 136,16 C164,16 188,38 188,68 C188,104 160,136 100,178 Z";

/** The ending: a clay ball with a puffy heart that beats. The engine draws the ending's sign above it. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const squish = useSquish();
  const heart = useSquish(8);
  const bob = useFloat(12, 70);
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  // Two quick beats, then a rest, every second.
  const beat = frame % 30 < 15 ? 1 + 0.07 * Math.abs(Math.sin(((frame % 30) / 15) * Math.PI * 2)) : 1;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + bob,
          width: box.w,
          height: box.h,
          ...ball(colour(palette, 2)),
          transform: squish.transform,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={230} height={230} viewBox="0 0 200 200" style={{ transform: `${heart.transform} scale(${beat})`, filter: "drop-shadow(0 12px 14px rgba(40, 30, 60, 0.25))", marginTop: 16 }}>
          <defs>
            <radialGradient id="soft3d-heart" cx="0.34" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.35" stopColor="#FFF4F4" />
              <stop offset="1" stopColor="#E9D9DE" />
            </radialGradient>
          </defs>
          <path d={HEART} fill="url(#soft3d-heart)" />
        </svg>
      </div>
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
