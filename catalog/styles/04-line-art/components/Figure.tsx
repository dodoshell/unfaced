import { useCurrentFrame } from "remotion";
import { FigureFrame, type FigureProps, type Part, polygonPath, smoothPath } from "../../../../engine/remotion/kit/index.js";
import { colour } from "./layout.js";
import { drawAt, ellipsePath, FONT, LINE, Pen } from "./shared.js";

/** Frames one part takes to draw, and the most the whole figure takes. */
const PART_FRAMES = 14;
const FIGURE_FRAMES = 30;
/** Small solid marks: a pen dot rather than a ring. */
const DOTS = new Set(["eye", "nose"]);

const f = (n: number) => n.toFixed(2);

/** A capsule's outline: two sides and two round ends. */
function capsulePath(x1: number, y1: number, x2: number, y2: number, r: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.01) return ellipsePath(x1, y1, r, r);
  const nx = (-(y2 - y1) / len) * r;
  const ny = ((x2 - x1) / len) * r;
  return `M ${f(x1 + nx)} ${f(y1 + ny)} L ${f(x2 + nx)} ${f(y2 + ny)} A ${f(r)} ${f(r)} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)} L ${f(x1 - nx)} ${f(y1 - ny)} A ${f(r)} ${f(r)} 0 0 0 ${f(x1 + nx)} ${f(y1 + ny)} Z`;
}

/** The outline of a closed part, or undefined for parts drawn some other way. */
function outline(p: Part): { d: string; transform?: string } | undefined {
  switch (p.kind) {
    case "ellipse":
      return { d: ellipsePath(p.cx, p.cy, p.rx, p.ry), transform: p.rotate ? `rotate(${p.rotate} ${p.cx} ${p.cy})` : undefined };
    case "capsule":
      return { d: capsulePath(p.x1, p.y1, p.x2, p.y2, p.r) };
    case "shape":
      return { d: polygonPath(p.points) };
    default:
      return undefined;
  }
}

interface Pens {
  ink: string;
  /** Ground lines. */
  soft: string;
  paper: string;
  accent: string;
  /** The line weight in figure units. */
  w: number;
}

/** One part in line art: an outline over a paper-coloured knock-out, so lines behind it stop at its edge. */
function linePart(p: Part, t: number, key: number, { ink, soft, paper, accent, w }: Pens): React.ReactNode {
  if (t <= 0) return null;
  if (p.role === "shadow") {
    // A ground line in the secondary colour instead of a shadow.
    if (p.kind !== "ellipse") return null;
    const y = p.cy + p.ry * 0.6;
    return <Pen key={key} d={`M ${f(p.cx - p.rx * 0.8)} ${f(y)} L ${f(p.cx + p.rx * 0.8)} ${f(y)}`} p={t} colour={soft} width={w} />;
  }
  // Scenery shapes (a tuft of grass) are open strokes, not closed outlines.
  if (p.kind === "shape" && p.role === "prop" && p.points.length > 2) {
    return (
      <g key={key}>
        <path d={polygonPath(p.points)} fill={paper} />
        <Pen d={polygonPath(p.points, false)} p={t} colour={ink} width={w} />
      </g>
    );
  }
  if (p.role === "eye-shine" && p.kind === "ellipse") return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={paper} opacity={t >= 1 ? 1 : 0} />;
  if (p.role === "cheek" && p.kind === "ellipse") {
    // Blush as two short accent hatches.
    const d = [-0.45, 0.25].map((k) => `M ${f(p.cx + p.rx * k - p.rx * 0.2)} ${f(p.cy + p.ry * 0.7)} L ${f(p.cx + p.rx * k + p.rx * 0.2)} ${f(p.cy - p.ry * 0.7)}`).join(" ");
    return <Pen key={key} d={d} p={t} colour={accent} width={w * 0.8} />;
  }
  if (DOTS.has(p.role) && p.kind === "ellipse") {
    const s = Math.min(1, t * 1.6);
    return <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx * s} ry={p.ry * s} fill={ink} transform={p.rotate ? `rotate(${p.rotate} ${p.cx} ${p.cy})` : undefined} />;
  }
  if (p.kind === "stroke") return <Pen key={key} d={smoothPath(p.points)} p={t} colour={ink} width={w} />;
  if (p.kind === "mark") {
    return (
      <text key={key} x={p.x} y={p.y} fontSize={p.size} fontFamily={FONT} fontWeight={500} textAnchor="middle" fill={ink} opacity={t}>
        {p.glyph}
      </text>
    );
  }
  const o = outline(p);
  if (!o) return null;
  return (
    <g key={key} transform={o.transform}>
      <path d={o.d} fill={paper} />
      <Pen d={o.d} p={t} colour={ink} width={w} />
    </g>
  );
}

/**
 * Characters and the demo's park in line art: every part an outline of the one line weight,
 * drawn on back to front as the scene starts; eyes and noses are pen dots, blush two accent hatches.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const frame = useCurrentFrame();
  const pens: Pens = { ink: colour(palette, 4), soft: colour(palette, 2), paper: colour(palette, 0), accent: colour(palette, 1), w: (LINE * 100) / place.size };
  const stagger = parts.length > 1 ? Math.min(2, (FIGURE_FRAMES - PART_FRAMES) / (parts.length - 1)) : 0;
  return <FigureFrame {...place}>{parts.map((p, i) => linePart(p, drawAt(frame, i * stagger, PART_FRAMES), i, pens))}</FigureFrame>;
};
