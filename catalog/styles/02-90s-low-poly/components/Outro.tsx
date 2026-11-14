import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { tone } from "./colours.js";
import { colour, layout } from "./layout.js";
import { Poly, star } from "./poly.js";
import { shadowInk, usePop } from "./shared.js";

const STAR = star();
const RING_EVERY = 34;

/** An eight-sided ring around (cx, cy). */
const ring = (cx: number, cy: number, r: number, turn: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = turn + (i / 8) * Math.PI * 2;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");

/** The ending: a chunky star spinning like a collectible, sending out faceted rings. The engine draws the ending's sign above it. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const pop = usePop();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  const ink = shadowInk(palette);
  const gold = colour(palette, 3);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + Math.sin((frame / 60) * Math.PI * 2) * 10;
  const rings = [0, 1, 2].map((k) => {
    const age = (frame % RING_EVERY) + k * RING_EVERY;
    return { r: 150 + age * 2.6, opacity: Math.max(0, 1 - age / (RING_EVERY * 3)) };
  });
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: pop }}>
        {rings.map((r, i) => (
          <polygon key={i} points={ring(cx, cy, r.r, frame * 0.01 + i * 0.2)} fill="none" stroke={i % 2 === 0 ? gold : colour(palette, 1)} strokeOpacity={r.opacity} strokeWidth={14} strokeLinejoin="miter" />
        ))}
      </svg>
      <Poly mesh={STAR} x={cx} y={cy} size={190 * pop} turns={[["y", frame * 0.07 + (1 - pop) * 4], ["x", -0.12]]} colours={[gold, tone(gold, -0.14)]} outline={{ width: 7, colour: ink }} ambient={0.42} />
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
