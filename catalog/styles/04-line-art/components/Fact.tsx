import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { drawAt, ellipsePath, FONT, LINE, Pen, Sheet, useDraw, useSettle } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A light bulb in a 200-unit box: glass, screw base, filament and rays. */
const BULB = {
  glass: "M 78 136 C 78 116 52 106 52 76 A 48 48 0 1 1 148 76 C 148 106 122 116 122 136 Z",
  base: "M 80 150 H 120 M 84 164 H 116 M 92 178 H 108",
  filament: "M 86 136 V 104 L 93 94 L 100 104 L 107 94 L 114 104 V 136",
  rays: [-90, -135, -45, 180, 0]
    .map((deg) => {
      const [c, s] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
      return `M ${(100 + 64 * c).toFixed(1)} ${(76 + 64 * s).toFixed(1)} L ${(100 + 80 * c).toFixed(1)} ${(76 + 80 * s).toFixed(1)}`;
    })
    .join(" "),
};

/** A light bulb drawn on in the middle of `box`, for facts that carry no number. */
const Bulb: React.FC<{ box: { x: number; y: number; w: number; h: number }; ink: string; accent: string }> = ({ box, ink, accent }) => {
  const s = (box.w * 0.74) / 200;
  const w = LINE / s;
  // The drawing's middle, (100, 87), on the middle of the box.
  const at = `translate(${box.x + box.w / 2 - 100 * s} ${box.y + box.h / 2 - 87 * s}) scale(${s})`;
  return (
    <g transform={at}>
      <Pen d={BULB.glass} p={useDraw(8, 26)} colour={ink} width={w} />
      <Pen d={BULB.base} p={useDraw(26, 12)} colour={ink} width={w} />
      <Pen d={BULB.filament} p={useDraw(32, 16)} colour={accent} width={w} />
      <Pen d={BULB.rays} p={useDraw(44, 12)} colour={accent} width={w} />
    </g>
  );
};

/**
 * A fact: one circle drawn in a single stroke around the fact's number (a light bulb for
 * script types that don't number their beats), and a thin accent arc around it that
 * grows as the fact is told. The captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const { plan } = useVideo();
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const accent = colour(palette, 1);
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = box.w / 2 - 34;
  const ring = drawAt(frame, 0, 28);
  const told = Math.min(1, frame / Math.max(1, scene.durationInFrames - 1));
  const settle = useSettle(12);
  return (
    <AbsoluteFill>
      <Sheet>
        <Pen d={ellipsePath(cx, cy, r, r)} p={ring} colour={ink} />
        <Pen d={ellipsePath(cx, cy, r + 26, r + 26)} p={told} colour={accent} />
        {!label && <Bulb box={box} ink={ink} accent={accent} />}
      </Sheet>
      {label && (
        <div
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 200,
            fontSize: label.length > 1 ? 200 : 260,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: ink,
            ...settle,
          }}
        >
          {label}
        </div>
      )}
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={cx} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
