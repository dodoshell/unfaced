import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, type EndingMarkKind, endingMark, endingPose, type Rect, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { drawAt, ellipsePath, FONT, LINE, Pen, Sheet } from "./shared.js";

const HEART = "M 100 172 C 40 132 16 102 16 70 C 16 42 38 22 64 22 C 80 22 92 30 100 44 C 108 30 120 22 136 22 C 162 22 184 42 184 70 C 184 102 160 132 100 172 Z";
const BUBBLE = "M 54 22 H 146 A 34 34 0 0 1 180 56 V 112 A 34 34 0 0 1 146 146 H 104 L 58 184 L 66 146 H 54 A 34 34 0 0 1 20 112 V 56 A 34 34 0 0 1 54 22 Z";
/** Ending 06's arrow turning back on itself, around (100, 100). */
const TURN = "M 139.85 52.51 A 62 62 0 1 0 158.26 121.21";

/** Two strokes of a chevron arrowhead at `tip`, pointing along `angle` (degrees). */
const head = (tip: [number, number], angle: number, size = 26): string => {
  const at = (a: number) => [tip[0] - size * Math.cos(((angle + a) * Math.PI) / 180), tip[1] - size * Math.sin(((angle + a) * Math.PI) / 180)].map((n) => n.toFixed(2)).join(" ");
  return `M ${at(-38)} L ${tip[0]} ${tip[1]} L ${at(38)}`;
};

/**
 * The ending's sign in line art, in a 200-unit box: an arrow with dots that run on, a
 * question bubble, a follow circle with a 2, an arrow turning back, or a heart for a punchline.
 */
const Sign: React.FC<{ kind: EndingMarkKind | undefined; ink: string; accent: string; w: number }> = ({ kind, ink, accent, w }) => {
  const frame = useCurrentFrame();
  const p = drawAt(frame, 0, 30);
  const late = drawAt(frame, 22, 14);
  const text = { fontFamily: FONT, textAnchor: "middle" as const, opacity: late };
  switch (kind) {
    case "continued": {
      const on = Math.floor(frame / 8) % 4;
      const nudge = Math.sin(frame / 9) * 4;
      return (
        <>
          {[16, 44, 72].map((x, i) => (
            <Pen key={x} d={ellipsePath(x, 100, 8, 8)} p={late} colour={i < on ? accent : ink} width={w} />
          ))}
          <g transform={`translate(${nudge} 0)`}>
            <Pen d="M 100 100 H 186" p={p} colour={ink} width={w} />
            <Pen d={head([188, 100], 0, 42)} p={late} colour={ink} width={w} />
          </g>
        </>
      );
    }
    case "comment":
      return (
        <g transform={`translate(0 ${Math.sin(frame / 10) * 6})`}>
          <Pen d={BUBBLE} p={p} colour={ink} width={w} />
          <text x={100} y={118} fontSize={88} fontWeight={400} fill={accent} {...text}>
            ?
          </text>
        </g>
      );
    case "follow": {
      const beat = 1 + 0.08 * Math.sin(frame / 6);
      return (
        <g transform={`translate(0 ${Math.sin(frame / 10) * 6})`}>
          <Pen d={ellipsePath(92, 92, 72, 72)} p={p} colour={ink} width={w} />
          <text x={92} y={130} fontSize={108} fontWeight={200} fill={ink} {...text}>
            2
          </text>
          <g transform={`translate(166 166) scale(${beat})`}>
            <Pen d={ellipsePath(0, 0, 24, 24)} p={late} colour={accent} width={w} />
            <Pen d="M -10 0 H 10 M 0 -10 V 10" p={late} colour={accent} width={w} />
          </g>
        </g>
      );
    }
    case "callback":
      // Turns slowly the way it points.
      return (
        <g transform={`rotate(${-frame * 0.6} 100 100)`}>
          <Pen d={TURN} p={p} colour={ink} width={w} />
          <Pen d={head([158.26, 121.21], -70, 36)} p={late} colour={accent} width={w} />
        </g>
      );
    default: {
      const beat = frame > 30 ? 1 + 0.07 * Math.sin((frame - 30) / 7) : 1;
      return (
        <g transform={`translate(100 100) scale(${beat}) translate(-100 -100)`}>
          <Pen d={HEART} p={p} colour={accent} width={w} />
        </g>
      );
    }
  }
};

/** The ending: the ending's sign (or a heart for a punchline) drawn on in a few strokes. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  const inner: Rect = { x: box.x + box.w * 0.08, y: box.y + box.h * 0.08, w: box.w * 0.84, h: box.h * 0.84 };
  const scale = inner.w / 200;
  return (
    <AbsoluteFill>
      <Sheet>
        <g transform={`translate(${inner.x} ${inner.y}) scale(${scale})`}>
          <Sign kind={endingMark(ending)} ink={colour(palette, 4)} accent={colour(palette, 1)} w={LINE / scale} />
        </g>
      </Sheet>
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={box.x + box.w / 2} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
