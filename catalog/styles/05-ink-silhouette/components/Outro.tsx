import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Character, EndingMark, endingMark, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { layout } from "./layout.js";
import { Bird, Hill, HILL_X, hillY, Moon, sky, useFadeIn, useFloat, useMoonAlreadyUp } from "./shared.js";

/** Three birds crossing the moon, for endings without a sign. */
const FLIGHT = [
  { dx: -150, dy: 20, span: 92, phase: 0 },
  { dx: -40, dy: -50, span: 74, phase: 6 },
  { dx: 50, dy: 40, span: 60, phase: 11 },
];

/**
 * The ending: the moon, and on it the ending's sign as an ink silhouette (a question bubble,
 * a follow button...). Endings without a sign get three birds flying across the moon.
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const mark = endingMark(ending);
  const s = sky(palette);
  const box = layout(scene, palette)[0]!;
  const up = useMoonAlreadyUp(scene);
  const rise = useFadeIn(0, 30);
  const moon = up ? 1 : rise;
  const sign = useFadeIn(up ? 6 : 16, 26);
  const float = useFloat(6, 160);
  const r = box.w / 2;
  const cx = box.x + r;
  const cy = box.y + r + float + (1 - moon) * 40;
  const signSize = r * 1.25;
  return (
    <AbsoluteFill>
      <Moon cx={cx} cy={cy} r={r} s={s} opacity={moon} />
      {mark ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: sign, transform: `scale(${0.95 + 0.05 * sign})`, transformOrigin: `${cx}px ${cy}px` }}>
          {/* Started 30 frames in, so the sign's own pop has settled: this style fades, it doesn't bounce. */}
          <Sequence from={-30} layout="none">
            <EndingMark kind={mark} box={{ x: cx - signSize / 2, y: cy - signSize / 2, w: signSize, h: signSize }} fill={s.ink} ink={s.moon} />
          </Sequence>
        </div>
      ) : (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: sign }}>
          {FLIGHT.map((b, i) => (
            <Bird
              key={i}
              x={cx + b.dx + frame * 0.9}
              y={cy + b.dy + Math.sin((frame + b.phase * 7) / 30) * 8}
              span={b.span}
              flap={Math.sin((frame + b.phase) / 5)}
              ink={s.ink}
              width={b.span / 9}
            />
          ))}
        </svg>
      )}
      <Hill s={s} />
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={HILL_X} y={hillY(HILL_X)} size={230} />}
    </AbsoluteFill>
  );
};
