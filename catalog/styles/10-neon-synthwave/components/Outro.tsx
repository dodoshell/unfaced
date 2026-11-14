import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, type EndingMarkKind, endingMark, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { alpha, circlePath, core, DISPLAY, glowText, night, Tube, useFloat, useGrow, useHum, useIgnite } from "./shared.js";

/**
 * The ending's sign bent in neon (the same shapes as the engine's signs, in a 200×200 box):
 * an arrow with dots that run on, a question bubble, a follow button with a 2, an arrow turning back.
 */
const NeonSign: React.FC<{ kind: EndingMarkKind; palette: string[]; lit: number }> = ({ kind, palette, lit }) => {
  const frame = useCurrentFrame();
  const accent = colour(palette, 1);
  const secondary = colour(palette, 2);
  const highlight = colour(palette, 3);
  const glyph = (text: string, x: number, y: number, size: number) => (
    <foreignObject x={x - size} y={y - size} width={size * 2} height={size * 2}>
      <div style={{ width: size * 2, height: size * 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: size, lineHeight: 1, paddingTop: size * 0.1, ...glowText(highlight, size * 2) }}>
        {text}
      </div>
    </foreignObject>
  );
  switch (kind) {
    case "continued": {
      const dots = Math.floor(frame / 7) % 4;
      return (
        <g opacity={lit}>
          <Tube d="M 14 62 L 118 62 L 118 24 L 188 100 L 118 176 L 118 138 L 14 138 Z" colour={accent} width={4} fill={alpha(accent, 0.12)} />
          {[48, 80, 112].map((x, i) => (
            <circle key={x} cx={x} cy={100} r={9} fill={i < dots ? core(highlight) : alpha(highlight, 0.15)} stroke={highlight} strokeWidth={i < dots ? 4 : 1} />
          ))}
        </g>
      );
    }
    case "comment":
      return (
        <g opacity={lit} transform={`translate(0 ${Math.sin(frame / 7) * 4})`}>
          <Tube d="M54,22 H146 A34,34 0 0 1 180,56 V112 A34,34 0 0 1 146,146 H104 L58,184 L66,146 H54 A34,34 0 0 1 20,112 V56 A34,34 0 0 1 54,22 Z" colour={secondary} width={4} fill={alpha(secondary, 0.1)} />
          {glyph("?", 100, 86, 70)}
        </g>
      );
    case "follow": {
      const beat = 1 + 0.08 * Math.max(0, Math.sin(frame / 5));
      return (
        <g opacity={lit}>
          <Tube d={circlePath(92, 92, 76)} colour={accent} width={4} fill={alpha(accent, 0.1)} />
          {glyph("2", 92, 94, 78)}
          <g transform={`translate(156 156) scale(${beat})`}>
            <Tube d={circlePath(0, 0, 32)} colour={secondary} width={3.5} fill={alpha(secondary, 0.25)} />
            <Tube d="M -14 0 H 14 M 0 -14 V 14" colour={highlight} width={4} />
          </g>
        </g>
      );
    }
    case "callback":
      return (
        <g opacity={lit}>
          <Tube d="M139.85,52.51 A62,62 0 1 0 158.26,121.21" colour={accent} width={6} />
          <Tube d="M 171 84 L 186 134 L 131 116 Z" colour={highlight} width={4} fill={alpha(highlight, 0.2)} />
        </g>
      );
  }
};

/**
 * The ending: a burst of neon rays turning round the ending's sign, bent in neon; a punchline
 * (no sign) gets a Monoton exclamation mark. The style draws the sign itself.
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const mark = endingMark(ending);
  const box = layout(scene, palette)[0]!;
  const rays = useIgnite(3);
  const sign = useIgnite(0);
  const grow = useGrow(0, 0.7);
  const hum = useHum(5);
  const bob = useFloat(8, 70);
  const r = box.w / 2;
  const tubes = [colour(palette, 1), colour(palette, 2), colour(palette, 3)];
  const pulse = 1 + 0.05 * Math.sin(frame / 6);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y + bob, width: box.w, height: box.h }}>
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} style={{ position: "absolute", overflow: "visible" }}>
          <circle cx={r} cy={r} r={r * 0.7 * grow} fill={alpha(night(palette), 0.78)} opacity={Math.min(1, sign * 2)} />
          <g transform={`rotate(${frame * 0.5} ${r} ${r})`} opacity={rays * hum}>
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              const [r1, r2] = i % 2 === 0 ? [r * 0.78, r * 1.08] : [r * 0.86, r * 1.0];
              return <Tube key={i} d={`M ${r + Math.cos(a) * r1} ${r + Math.sin(a) * r1} L ${r + Math.cos(a) * r2} ${r + Math.sin(a) * r2}`} colour={tubes[i % 3]!} width={4} />;
            })}
          </g>
          {mark && (
            <g transform={`translate(${r} ${r}) scale(${grow * 1.45}) translate(-100 -100)`}>
              <NeonSign kind={mark} palette={palette} lit={sign * hum} />
            </g>
          )}
        </svg>
        {!mark && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontSize: 300,
              lineHeight: 1,
              paddingTop: 30,
              transform: `scale(${grow * pulse})`,
              ...glowText(colour(palette, 3), 300, { left: colour(palette, 2), right: colour(palette, 1), offset: 6 }),
              opacity: sign * hum,
            }}
          >
            !
          </div>
        )}
      </div>
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1160} size={230} />}
    </AbsoluteFill>
  );
};
