import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { tone } from "./colours.js";
import { colour, layout } from "./layout.js";
import { gem, Poly, star } from "./poly.js";
import { arcadeText, shadowInk, usePop } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

const GEM = gem(8);
const STAR = star();

/** A two-tone diamond glint that flashes on and off. */
const Glint: React.FC<{ x: number; y: number; size: number; colour: string; phase: number; pop: number }> = ({ x, y, size, colour: c, phase, pop }) => {
  const frame = useCurrentFrame();
  const flash = Math.max(0, Math.sin(((frame + phase) / 36) * Math.PI * 2));
  const s = size * pop * (0.35 + 0.65 * flash);
  return (
    <svg width={2} height={2} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <polygon points={`0,${-s} ${s * 0.38},0 0,${s} ${-s * 0.38},0`} fill={tone(c, 0.35)} />
      <polygon points={`0,${-s} ${s * 0.38},0 0,${s}`} fill={c} />
    </svg>
  );
};

/** A fact: a big cut gem that spins in and rocks, the fact's number on its face in arcade type. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const pop = usePop();
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const ink = shadowInk(palette);
  const accent = colour(palette, 1);
  // Spins in three half turns, then rocks so the facets catch the light.
  const ry = (1 - pop) * -Math.PI * 3 + Math.sin(frame / 42) * 0.42;
  const rx = -0.18 + Math.sin(frame / 61) * 0.1;
  const bob = Math.sin((frame / 70) * Math.PI * 2) * 12;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + bob;
  const size = (box.w / 2 - 12) * pop;
  // Where the gem's flat table faces now, so the number stays printed on it.
  const tableX = 0.4 * Math.sin(ry) * size;
  const tableY = 0.4 * Math.cos(ry) * Math.sin(rx) * size;
  const facing = Math.cos(ry);
  return (
    <AbsoluteFill>
      <Glint x={box.x + 6} y={box.y + 70} size={46} colour={colour(palette, 3)} phase={0} pop={pop} />
      <Glint x={box.x + box.w - 10} y={box.y + 120} size={34} colour={colour(palette, 2)} phase={14} pop={pop} />
      <Glint x={box.x + box.w - 40} y={box.y + box.h - 30} size={40} colour={colour(palette, 3)} phase={24} pop={pop} />
      <Poly mesh={GEM} x={cx} y={cy} size={size} turns={[["y", ry], ["x", rx]]} colours={[accent, tone(accent, -0.18)]} outline={{ width: 6, colour: ink }} ambient={0.4} />
      {facing > 0.2 &&
        (label ? (
          <div
            style={{
              position: "absolute",
              left: box.x,
              top: box.y + bob,
              width: box.w,
              height: box.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translate(${tableX}px, ${tableY}px) scale(${facing * pop}, ${pop})`,
            }}
          >
            {/* Press Start 2P sits a little high in its em box; the padding centres the digits. */}
            <div style={{ ...arcadeText(label.length > 1 ? 112 : 150, ink), paddingLeft: label.length > 1 ? 14 : 12, paddingTop: 16 }}>{label}</div>
          </div>
        ) : (
          <Poly mesh={STAR} x={cx + tableX} y={cy + tableY} size={size * 0.42} turns={[["y", ry * 1.6]]} colours={[colour(palette, 3), tone(colour(palette, 3), -0.15)]} outline={{ width: 5, colour: ink }} />
        ))}
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
