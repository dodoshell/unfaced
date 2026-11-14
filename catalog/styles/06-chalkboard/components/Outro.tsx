import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, type EndingMarkKind, endingMark, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { chalk } from "./colours.js";
import { layout } from "./layout.js";
import { Board, boiled, CHALK, Chalk, drawAt, dusty, FONT, grain, handLine, handLoop, handPolygon, type Pt, useBoil } from "./shared.js";

/** Points along a circular arc around (cx, cy), from `from` to `to` degrees. */
const arc = (cx: number, cy: number, r: number, from: number, to: number): Pt[] => {
  const n = Math.max(4, Math.round(Math.abs(to - from) / 8));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
};

/** Two strokes of an arrowhead at `tip`, pointing along `angle` (degrees), as one line. */
const arrowHead = (tip: Pt, angle: number, size: number): Pt[] => {
  const arm = (a: number): Pt => [tip[0] - size * Math.cos(((angle + a) * Math.PI) / 180), tip[1] - size * Math.sin(((angle + a) * Math.PI) / 180)];
  return handPolygon([arm(-36), tip, arm(36)], 77, 0, 8, false);
};

interface SignProps {
  kind: EndingMarkKind | undefined;
  ink: string;
  accent: string;
  soft: string;
  /** The chalk width in the sign's units. */
  w: number;
}

/**
 * The ending's sign in chalk, in a 200-unit box: an arrow with dots that run on, a question
 * bubble, a circled 2 with a plus, an arrow turning back, or a smiley for a punchline.
 */
const Sign: React.FC<SignProps> = ({ kind, ink, accent, soft, w }) => {
  const frame = useCurrentFrame();
  const boil = useBoil();
  const p = drawAt(frame, 0, 20);
  const late = drawAt(frame, 16, 12);
  const b = (pts: Pt[], seed: number) => boiled(pts, seed, boil, w * 0.25);
  const glyph = { fontFamily: FONT, fontWeight: 700, textAnchor: "middle" as const, opacity: late, style: dusty(accent) };
  switch (kind) {
    case "continued": {
      const on = Math.floor(frame / 8) % 4;
      return (
        <>
          {[18, 46, 74].map((x, i) => (
            <Chalk key={x} points={b(handLoop(x, 100, 8, 8, 90 + i, 1.05), 90 + i)} closed p={late} colour={i < on ? accent : ink} width={w} seed={90 + i} boil={boil} />
          ))}
          <Chalk points={b(handLine([98, 102], [184, 98], 81, 3), 81)} p={p} colour={ink} width={w} seed={81} boil={boil} />
          <Chalk points={b(arrowHead([188, 98], -2, 40), 82)} p={late} colour={ink} width={w} seed={82} boil={boil} />
        </>
      );
    }
    case "comment": {
      // An oval bubble with its tail at the lower left.
      const oval = handLoop(100, 86, 84, 62, 83, 0.9, 128, 0.03);
      return (
        <>
          <Chalk points={b([...oval, [44, 186]], 83)} closed p={p} colour={ink} width={w} seed={83} boil={boil} />
          <text x={100} y={122} fontSize={110} fill={accent} {...glyph}>
            ?
          </text>
        </>
      );
    }
    case "follow":
      return (
        <>
          <Chalk points={b(handLoop(90, 90, 72, 70, 84, 1.1), 84)} p={p} colour={ink} width={w} seed={84} boil={boil} />
          <text x={90} y={132} fontSize={124} fill={ink} {...glyph} style={dusty(ink)}>
            2
          </text>
          <Chalk points={b(handLoop(166, 166, 26, 26, 85, 1.08), 85)} p={late} colour={accent} width={w} seed={85} boil={boil} />
          <Chalk points={b(handLine([154, 166], [178, 166], 86, 1), 86)} p={late} colour={accent} width={w} seed={86} boil={boil} />
          <Chalk points={b(handLine([166, 154], [166, 178], 87, 1), 87)} p={late} colour={accent} width={w} seed={87} boil={boil} />
        </>
      );
    case "callback":
      return (
        <>
          <Chalk points={b(arc(100, 100, 66, -50, -340), 88)} p={p} colour={ink} width={w} seed={88} boil={boil} />
          <Chalk points={b(arrowHead([162.0, 122.6], -70, 38), 89)} p={late} colour={accent} width={w} seed={89} boil={boil} />
        </>
      );
    default:
      return (
        <>
          <Chalk points={b(handLoop(100, 100, 84, 82, 91, 1.08), 91)} p={p} colour={accent} width={w} seed={91} boil={boil} />
          <Chalk points={b(handLine([74, 74], [74, 96], 92, 1), 92)} p={late} colour={ink} width={w} seed={92} boil={boil} />
          <Chalk points={b(handLine([126, 74], [126, 96], 93, 1), 93)} p={late} colour={ink} width={w} seed={93} boil={boil} />
          <Chalk points={b(arc(100, 100, 50, 25, 155), 94)} p={late} colour={soft} width={w} seed={94} boil={boil} />
        </>
      );
  }
};

/** The ending: the ending's sign (or a smiley for a punchline) drawn quickly in chalk. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  const scale = (box.w * 0.86) / 200;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={grain}>
        <Board>
          <g transform={`translate(${box.x + box.w * 0.07} ${box.y + box.h * 0.07}) scale(${scale})`}>
            <Sign kind={endingMark(ending)} ink={chalk(palette, 4)} accent={chalk(palette, 1)} soft={chalk(palette, 2)} w={CHALK / scale} />
          </g>
        </Board>
      </AbsoluteFill>
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={box.x + box.w / 2} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
