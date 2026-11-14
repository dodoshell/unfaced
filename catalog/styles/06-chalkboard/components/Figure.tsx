import { useCurrentFrame } from "remotion";
import { FigureFrame, type FigureProps, type Part, partBounds, smoothPath } from "../../../../engine/remotion/kit/index.js";
import { chalk, pastel } from "./colours.js";
import { colour } from "./layout.js";
import { BOIL, CHALK, Chalk, drawAt, FONT, grain, handLine, handPolygon, type Pt, wobble } from "./shared.js";

/** Frames one part takes to draw, and the most the whole figure takes. */
const PART_FRAMES = 10;
const FIGURE_FRAMES = 24;
/** Small solid marks: a dab of chalk rather than a ring. */
const DOTS = new Set(["eye", "nose"]);

interface Sticks {
  ink: string;
  board: string;
  soft: string;
  /** The chalk width in figure units. */
  w: number;
  boil: number;
}

/** A closed part's outline as points, wobbled a little differently at every boil. */
function outlinePoints(p: Part, seed: number, amp: number): Pt[] | undefined {
  switch (p.kind) {
    case "ellipse": {
      const n = Math.max(12, Math.min(40, Math.round((p.rx + p.ry) * 0.9)));
      const rot = (p.rotate * Math.PI) / 180;
      return Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const [x, y] = [Math.cos(a) * p.rx, Math.sin(a) * p.ry];
        const k = 1 + (wobble(seed, i) * amp) / Math.max(p.rx, p.ry);
        return [p.cx + (x * Math.cos(rot) - y * Math.sin(rot)) * k, p.cy + (x * Math.sin(rot) + y * Math.cos(rot)) * k] as Pt;
      });
    }
    case "capsule": {
      const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      const base = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
      const cap = (cx: number, cy: number, from: number) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = base + from + (i / 6) * Math.PI;
          return [cx + Math.cos(a) * p.r, cy + Math.sin(a) * p.r] as Pt;
        });
      if (len < 0.01) return handPolygon(cap(p.x1, p.y1, 0).concat(cap(p.x1, p.y1, Math.PI)), seed, amp * 0.5, 6);
      return handPolygon([...cap(p.x2, p.y2, -Math.PI / 2), ...cap(p.x1, p.y1, Math.PI / 2)], seed, amp * 0.5, 6);
    }
    case "shape":
      return handPolygon(p.points, seed, amp * 0.5, 5);
    default:
      return undefined;
  }
}

/** One part in chalk: rubbed-in colour over a knock-out of board (lines behind it fade out), then a chalk outline. */
function chalkPart(p: Part, t: number, key: number, { ink, board, soft, w, boil }: Sticks): React.ReactNode {
  if (t <= 0) return null;
  const seed = key * 13 + 5;
  const amp = w * 0.25;
  if (p.role === "shadow") {
    if (p.kind !== "ellipse") return null;
    // Two quick strokes of chalk on the ground.
    const y = p.cy + p.ry * 0.4;
    return (
      <g key={key} opacity={0.45}>
        <Chalk points={handLine([p.cx - p.rx * 0.85, y], [p.cx + p.rx * 0.7, y], seed + boil, amp)} p={t} colour={ink} width={w} seed={seed} boil={boil} />
        <Chalk points={handLine([p.cx - p.rx * 0.4, y + w * 1.8], [p.cx + p.rx * 0.9, y + w * 1.8], seed + 1 + boil, amp)} p={t} colour={ink} width={w} seed={seed + 1} boil={boil} />
      </g>
    );
  }
  if (p.role === "eye-shine" && p.kind === "ellipse") return t >= 1 ? <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={board} /> : null;
  if (p.role === "cheek" && p.kind === "ellipse") return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={soft} opacity={0.5 * t} />;
  if (DOTS.has(p.role) && p.kind === "ellipse") {
    const s = Math.min(1, t * 1.6);
    return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx * s} ry={p.ry * s} fill={ink} transform={p.rotate ? `rotate(${p.rotate} ${p.cx} ${p.cy})` : undefined} />;
  }
  if (p.kind === "stroke") {
    const pts = p.points.map((q, i) => [q[0] + wobble(seed + boil, i) * amp * 0.4, q[1] + wobble(seed + 3 + boil, i) * amp * 0.4] as Pt);
    return <Chalk key={key} points={pts} p={t} colour={p.line ? ink : pastel(p.colour, ink)} width={p.line ? w * 0.8 : w} seed={seed} boil={boil} />;
  }
  if (p.kind === "mark") {
    return (
      <text key={key} x={p.x} y={p.y} fontSize={p.size * 1.25} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill={ink} opacity={t}>
        {p.glyph}
      </text>
    );
  }
  const tint = pastel(p.fill, ink);
  // Scenery shapes (a tuft of grass, the lawn) are open chalk strokes: chalk doesn't fill a field.
  if (p.kind === "shape" && p.role === "prop") {
    return <Chalk key={key} points={handPolygon(p.points, seed + boil * 101, amp * 0.5, 5, false)} p={t} colour={tint} width={w} seed={seed} boil={boil} />;
  }
  const pts = outlinePoints(p, seed + boil * 101, amp);
  if (!pts) return null;
  const d = smoothPath(pts, true);
  return (
    <g key={key}>
      <path d={d} fill={board} opacity={0.85} />
      <path d={d} fill={tint} opacity={0.36 * Math.min(1, t * 1.5)} />
      <Chalk points={pts} closed p={t} colour={p.role === "mouth" ? ink : tint} width={w} seed={seed} boil={boil} />
    </g>
  );
}

/**
 * Characters and the demo's park in chalk: each part rubbed in with pale chalk of its colour
 * and outlined in a rough, broken chalk line, drawn on as the scene starts. The lines boil
 * (wobble anew every few frames), and a static grain shows the board through the chalk.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const frame = useCurrentFrame();
  const sticks: Sticks = { ink: chalk(palette, 4), board: colour(palette, 0), soft: chalk(palette, 2), w: (CHALK * 100) / place.size, boil: Math.floor(frame / BOIL) };
  const stagger = parts.length > 1 ? Math.min(1.5, (FIGURE_FRAMES - PART_FRAMES) / (parts.length - 1)) : 0;
  if (parts.length === 0) return null;
  // The grain mask covers only its element's box, so it goes on a box around every part
  // (the figure's own frame is smaller than a tree or the lawn).
  const scale = place.size / 100;
  const pad = sticks.w * 3;
  const b = parts.map(partBounds).reduce((u, q) => ({ left: Math.min(u.left, q.left), right: Math.max(u.right, q.right), top: Math.min(u.top, q.top), bottom: Math.max(u.bottom, q.bottom) }));
  const left = place.x + (b.left - pad) * scale;
  const top = place.y + (b.top - pad) * scale;
  return (
    <div style={{ position: "absolute", left, top, width: (b.right - b.left + 2 * pad) * scale, height: (b.bottom - b.top + 2 * pad) * scale, ...grain }}>
      <div style={{ position: "absolute", left: -left, top: -top }}>
        <FigureFrame {...place}>{parts.map((p, i) => chalkPart(p, drawAt(frame, i * stagger, PART_FRAMES), i, sticks))}</FigureFrame>
      </div>
    </div>
  );
};
