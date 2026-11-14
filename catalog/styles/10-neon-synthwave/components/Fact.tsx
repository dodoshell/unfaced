import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { alpha, circlePath, DISPLAY, glowText, night, Tube, useFloat, useGrow, useHum, useIgnite } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A lightning bolt, for script types that don't number their beats (in a 200×200 box). */
const BOLT = "M 116 14 L 52 112 L 98 112 L 80 186 L 150 82 L 102 82 Z";

/**
 * A fact: the number in Monoton inside a neon ring, a dashed inner ring turning and four sights
 * turning the other way, all striking up like tubes. The captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const box = layout(scene, palette)[0]!;
  const ring = useIgnite(0);
  const inner = useIgnite(4);
  const digits = useIgnite(2);
  const grow = useGrow();
  const hum = useHum(n);
  const bob = useFloat(10, 84);
  // Each fact turns the three tube colours round: ring, dashes, number.
  const tubes = [colour(palette, 2), colour(palette, 1), colour(palette, 3)];
  const turn = (k: number) => tubes[((k % 3) + 3) % 3]!;
  const [outer, dashes, glyph] = [turn(n - 1), turn(n), turn(n + 1)];
  const r = box.w / 2;
  const size = label ? (label.length > 2 ? 140 : label.length > 1 ? 190 : 250) : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y + bob, width: box.w, height: box.h, transform: `scale(${grow})` }}>
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} style={{ position: "absolute", overflow: "visible" }}>
          <circle cx={r} cy={r} r={r - 10} fill={alpha(night(palette), 0.8)} opacity={Math.min(1, ring * 2)} />
          <Tube d={circlePath(r, r, r - 10)} colour={outer} width={7} opacity={ring * hum} />
          <g transform={`rotate(${frame * 0.7} ${r} ${r})`}>
            <Tube d={circlePath(r, r, r - 44)} colour={dashes} width={3} dash="18 22" opacity={inner * hum} />
          </g>
          <g transform={`rotate(${-frame * 0.4} ${r} ${r})`} opacity={inner}>
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`rotate(${a} ${r} ${r})`}>
                <Tube d={`M ${r} ${-36} L ${r} ${-8}`} colour={dashes} width={4} />
              </g>
            ))}
          </g>
          {!label && (
            <g transform={`translate(${r - 140} ${r - 140}) scale(1.4)`}>
              <Tube d={BOLT} colour={glyph} width={4.5} opacity={digits * hum} fill={alpha(glyph, 0.18)} />
            </g>
          )}
        </svg>
        {label && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: 1,
              paddingTop: size * 0.12,
              ...glowText(glyph, size, { left: colour(palette, 2), right: colour(palette, 1), offset: 5 }),
              opacity: digits * hum,
            }}
          >
            {label}
          </div>
        )}
      </div>
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1160} size={230} />}
    </AbsoluteFill>
  );
};
