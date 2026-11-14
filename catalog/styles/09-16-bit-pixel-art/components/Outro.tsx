import { AbsoluteFill, Freeze } from "remotion";
import { Character, endingMark, type EndingMarkKind, endingPose, type Part, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { BIG, ellipse, type Pt, rasterise, shape, star, tone } from "./pixels.js";
import { bob, boxColours, outlineInk, shadowedText, Sprite, stepIn, Twinkle, useStepFrame } from "./shared.js";

/** A flat bar for symbols (a plus): drawn without shading. */
const bar = (x1: number, y1: number, x2: number, y2: number, r: number, fill: string): Part => ({ kind: "capsule", role: "mark", x1, y1, x2, y2, r, fill });

/** A rounded rectangle as a polygon. */
function rounded(x0: number, y0: number, x1: number, y1: number, r: number): Pt[] {
  const corner = (cx: number, cy: number, from: number): Pt[] => Array.from({ length: 5 }, (_, i) => {
    const a = from + (i / 4) * (Math.PI / 2);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return [...corner(x1 - r, y0 + r, -Math.PI / 2), ...corner(x1 - r, y1 - r, 0), ...corner(x0 + r, y1 - r, Math.PI / 2), ...corner(x0 + r, y0 + r, Math.PI)];
}

/**
 * The ending's sign as a sprite, in units of a 200-wide box centred on 0: a question bubble,
 * an arrow that runs on, a follow button with a 2, an arrow turning back; a star otherwise.
 * Returns the parts and the glyph to letter on top, if any.
 */
function sign(kind: EndingMarkKind | undefined, frame: number, fill: string, paper: string, gold: string, ink: string): { parts: Part[]; glyph?: { text: string; x: number; y: number; size: number } } {
  switch (kind) {
    case "comment":
      return {
        parts: [shape(rounded(-88, -82, 88, 48, 34), paper), shape([[-34, 40], [-64, 90], [12, 40]], paper)],
        glyph: { text: "?", x: 0, y: -18, size: 120 },
      };
    case "continued": {
      const dots = Math.floor(frame / 9) % 4;
      return {
        parts: [
          shape([[-92, -30], [18, -30], [18, -72], [94, 0], [18, 72], [18, 30], [-92, 30]], fill),
          ...[-62, -28, 6].slice(0, dots).map((x) => ellipse(x, 0, 11, 11, paper)),
        ],
      };
    }
    case "follow": {
      const beat = Math.floor(frame / 9) % 2 === 0 ? 1 : 1.12;
      return {
        parts: [ellipse(-14, -14, 78, 78, fill), ellipse(60, 60, 34 * beat, 34 * beat, gold), bar(60 - 17 * beat, 60, 60 + 17 * beat, 60, 6, ink), bar(60, 60 - 17 * beat, 60, 60 + 17 * beat, 6, ink)],
        glyph: { text: "2", x: -14, y: -16, size: 112 },
      };
    }
    case "callback": {
      // An arc turning back on itself (counter-clockwise), ending in an arrowhead.
      const arc: Pt[] = Array.from({ length: 9 }, (_, i) => {
        const a = (-35 + (i / 8) * 255) * (Math.PI / 180);
        return [Math.cos(-a) * 60, Math.sin(-a) * 60];
      });
      const [ex, ey] = arc[0]!;
      return {
        parts: [
          { kind: "stroke", role: "prop", points: arc.reverse(), width: 30, colour: fill, line: false },
          shape([[ex - 34, ey - 6], [ex + 34, ey - 6], [ex, ey + 40]], fill),
        ],
      };
    }
    default:
      return { parts: [star(96, gold)] };
  }
}

/** The ending: its sign as a big sprite that pops in a step at a time and bobs, with twinkles. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useStepFrame();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  const ink = outlineInk(palette);
  const gold = colour(palette, 3);
  const { fill: paper } = boxColours(palette);
  const pop = stepIn(frame);
  const lift = bob(frame, 36, 0, BIG);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + lift;
  const scale = (box.w / 200) * pop;
  const kind = endingMark(ending);
  const { parts, glyph } = sign(kind, frame, colour(palette, 1), kind === "comment" ? paper : "#FFFFFF", gold, ink);
  const raster = rasterise(parts, { x: cx, y: cy, scale, cell: BIG, outline: ink, shade: true });
  return (
    <AbsoluteFill>
      {pop > 0 && <Sprite raster={raster} />}
      {glyph && pop >= 1 && (
        <div
          style={{
            position: "absolute",
            left: cx + glyph.x * scale - 150,
            top: cy + glyph.y * scale - 150,
            width: 300,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={shadowedText(glyph.size * scale, ink, kind === "comment" ? colour(palette, 1) : "#FFFFFF")}>{glyph.text}</div>
        </div>
      )}
      <Twinkle x={box.x + 6} y={box.y + 40} colour={gold} phase={0} cell={BIG} />
      <Twinkle x={box.x + box.w} y={box.y + 110} colour={tone(gold, 0.3)} phase={7} />
      <Twinkle x={box.x + 30} y={box.y + box.h - 30} colour={gold} phase={13} />
      <Twinkle x={box.x + box.w - 20} y={box.y + box.h + 10} colour={gold} phase={21} cell={BIG} />
      {mascot && (
        <Freeze frame={frame}>
          <Character rig={mascot.rig} pose={endingPose(ending)} x={540} y={1164} size={230} />
        </Freeze>
      )}
    </AbsoluteFill>
  );
};
