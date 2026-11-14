import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { layout } from "./layout.js";
import { alpha, FONT, Hill, HILL_X, hillY, Moon, roman, sky, useFadeIn, useFadeOut, useFloat, useMoonAlreadyUp } from "./shared.js";

/** The mascot explains each fact a little differently; no pointing, since a silhouette loses the raised paw. */
const FACT_POSES: Pose[] = ["talk", "happy", "thinking"];

/** A four-pointed star, for script types that don't number their beats. */
const star = (cx: number, cy: number, r: number) =>
  `M ${cx} ${cy - r} Q ${cx + r * 0.12} ${cy - r * 0.12} ${cx + r} ${cy} Q ${cx + r * 0.12} ${cy + r * 0.12} ${cx} ${cy + r} Q ${cx - r * 0.12} ${cy + r * 0.12} ${cx - r} ${cy} Q ${cx - r * 0.12} ${cy - r * 0.12} ${cx} ${cy - r} Z`;

/**
 * A fact: the fact's number as an ink Roman numeral on a rising moon, with thin clouds
 * drifting across it. The captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const { plan } = useVideo();
  const s = sky(palette);
  const box = layout(scene, palette)[0]!;
  const up = useMoonAlreadyUp(scene);
  const rise = useFadeIn(0, 30);
  const moon = up ? 1 : rise;
  const numeral = useFadeIn(up ? 4 : 14, 20) * useFadeOut(scene);
  const float = useFloat(6, 160);
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const text = label === undefined ? undefined : roman(label);
  const r = box.w / 2;
  const cx = box.x + r;
  const cy = box.y + r + float + (1 - moon) * 40;
  const size = text ? Math.max(110, Math.min(250, (box.w * 0.7) / (text.length * 0.56))) : 0;
  return (
    <AbsoluteFill>
      <Moon cx={cx} cy={cy} r={r} s={s} opacity={moon} />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: cy - r,
          width: box.w,
          height: box.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: numeral,
          transform: `scale(${0.94 + 0.06 * numeral})`,
        }}
      >
        {text ? (
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color: s.ink, marginTop: size * 0.06 }}>{text}</div>
        ) : (
          <svg width={box.w} height={box.h}>
            <path d={star(r, r, r * 0.55)} fill={s.ink} />
          </svg>
        )}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: moon }}>
        <rect x={cx - 360 + frame * 0.5} y={cy + r * 0.6} width={380} height={14} rx={7} fill={alpha(s.ink, 0.85)} />
        <rect x={cx - 20 - frame * 0.4} y={cy + r * 0.74} width={300} height={10} rx={5} fill={alpha(s.ink, 0.7)} />
        <rect x={cx + 40 - frame * 0.3} y={cy - r * 0.78} width={260} height={8} rx={4} fill={alpha(s.ink, 0.6)} />
      </svg>
      <Hill s={s} />
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={HILL_X} y={hillY(HILL_X)} size={230} />}
    </AbsoluteFill>
  );
};
