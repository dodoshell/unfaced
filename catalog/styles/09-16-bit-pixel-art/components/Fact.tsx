import { AbsoluteFill, Freeze } from "remotion";
import { Character, factBadge, factNumber, type Part, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { BIG, ellipse, rasterise, star, tone } from "./pixels.js";
import { bob, outlineInk, Sprite, STEP, struckText, Twinkle, useStepFrame } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** The coin's width as it turns to face the camera, one step at a time. */
const SPIN = [0.12, 0.42, 0.78];

/** A fact: a big pixel coin that flips round to face us, the fact's number struck on it. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useStepFrame();
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const ink = outlineInk(palette);
  const gold = colour(palette, 3);
  const width = SPIN[Math.floor(frame / STEP)] ?? 1;
  const lift = bob(frame, 40, 0, BIG);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + lift;
  const r = 96;
  const scale = (box.w / 2 - BIG) / r;
  const coin: Part[] = [
    ellipse(0, 0, r * width, r, gold),
    ellipse(0, 0, (r - 16) * width, r - 16, tone(gold, -0.16)),
    ellipse(-42 * width, -40, 10 * width, 22, tone(gold, 0.55), 35),
  ];
  if (!label && width === 1) coin.push(star(48, tone(gold, 0.4)));
  const raster = rasterise(coin, { x: cx, y: cy, scale, cell: BIG, outline: ink, shade: true });
  return (
    <AbsoluteFill>
      <Sprite raster={raster} />
      {label && (
        <div style={{ position: "absolute", left: box.x, top: box.y + lift, width: box.w, height: box.h, display: "flex", alignItems: "center", justifyContent: "center", transform: `scaleX(${width})` }}>
          <div style={{ ...struckText(label.length > 1 ? 180 : 220, tone(gold, -0.16)), marginTop: -12 }}>{label}</div>
        </div>
      )}
      <Twinkle x={box.x + 12} y={box.y + 60} colour={colour(palette, 3)} phase={0} cell={BIG} />
      <Twinkle x={box.x + box.w - 6} y={box.y + 150} colour={colour(palette, 1)} phase={8} />
      <Twinkle x={box.x + box.w - 36} y={box.y + box.h - 12} colour={colour(palette, 3)} phase={16} />
      {mascot && (
        <Freeze frame={frame}>
          <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1164} size={230} />
        </Freeze>
      )}
    </AbsoluteFill>
  );
};
