import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { FIGURE_BOX, FigureFrame, type FigureProps, type Part, polygonPath, smoothPath } from "../../../../engine/remotion/kit/index.js";
import { colour } from "./layout.js";
import { FONT, GRAIN_SIZE, GRAIN_TILE, nudge, nudged, type Pt, RIM, rng, STEP } from "./shared.js";

/** Parts too small or too flat to stand off the paper below them. */
const FLAT = new Set(["eye-shine", "cheek"]);
/** Edges longer than this many screen pixels are torn rather than cut. */
const TORN = 240;

/**
 * A part's outline as a piece of paper, in figure units (`px` figure units per screen pixel):
 * short straight scissor snips, or a torn edge with small teeth along the long sides of big
 * pieces like the lawn. Returns whether an edge is torn, to show the paper's white core.
 */
function cutOutline(p: Part, seed: number, px: number): { pts: Pt[]; torn: boolean } | undefined {
  const r = rng(seed);
  const jag = 1.2 * px;
  switch (p.kind) {
    case "ellipse": {
      const n = Math.max(10, Math.min(64, Math.round((Math.PI * (p.rx + p.ry)) / (10 * px))));
      const a0 = (p.rotate * Math.PI) / 180;
      const pts = Array.from({ length: n }, (_, i) => {
        const a = ((i + (r() - 0.5) * 0.4) / n) * Math.PI * 2;
        const k = 1 + ((r() - 0.5) * jag) / Math.max(p.rx, p.ry, 0.01);
        const [x, y] = [Math.cos(a) * p.rx * k, Math.sin(a) * p.ry * k];
        return [p.cx + x * Math.cos(a0) - y * Math.sin(a0), p.cy + x * Math.sin(a0) + y * Math.cos(a0)] as Pt;
      });
      return { pts, torn: false };
    }
    case "capsule": {
      const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      const a = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
      const n = Math.max(5, Math.min(16, Math.round((Math.PI * p.r) / (10 * px))));
      const cap = (cx: number, cy: number, from: number): Pt[] =>
        Array.from({ length: n + 1 }, (_, i) => {
          const t = from + (i / n) * Math.PI;
          const k = p.r + (i > 0 && i < n ? (r() - 0.5) * jag : 0);
          return [cx + Math.cos(t) * k, cy + Math.sin(t) * k] as Pt;
        });
      const pts = len < 0.01 ? [...cap(p.x1, p.y1, 0), ...cap(p.x1, p.y1, Math.PI)] : [...cap(p.x2, p.y2, a - Math.PI / 2), ...cap(p.x1, p.y1, a + Math.PI / 2)];
      return { pts, torn: false };
    }
    case "shape": {
      const pts: Pt[] = [];
      let torn = false;
      p.points.forEach((a, i) => {
        const b = p.points[(i + 1) % p.points.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.001;
        const long = len / px > TORN;
        torn ||= long;
        const n = long ? Math.min(240, Math.round(len / (8 * px))) : Math.max(1, Math.round(len / (60 * px)));
        const phase = r() * 6;
        for (let k = 0; k < n; k++) {
          const t = k / n;
          const j = k === 0 ? 0 : long ? (2.2 * Math.sin(t * 9 + phase) + (r() - 0.5) * 5) * px : (r() - 0.5) * jag;
          pts.push([a[0] + (b[0] - a[0]) * t - ((b[1] - a[1]) / len) * j, a[1] + (b[1] - a[1]) * t + ((b[0] - a[0]) / len) * j]);
        }
      });
      return { pts, torn };
    }
    default:
      return undefined;
  }
}

/** A seed that stays the same for a figure from frame to frame: its part count and first colours. */
const figureSeed = (parts: Part[]): number => {
  let s = parts.length;
  for (const p of parts.slice(0, 6)) {
    const c = p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill;
    for (let i = 0; i < c.length; i++) s = Math.imul(s ^ c.charCodeAt(i), 16777619);
  }
  return s >>> 0;
};

/**
 * Characters and the demo's park as cut paper: every part a flat piece with scissor-cut
 * edges, lifted off the pieces behind it by a soft shadow. Line work (eyes, mouths) is drawn
 * on in ink. The whole figure is nudged by hand between exposures, twelve times a second.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const frame = useCurrentFrame();
  const id = `pc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ink = colour(palette, 4);
  /** Figure units per screen pixel. */
  const px = 100 / place.size;
  const seed = figureSeed(parts);
  // A bigger figure turns by fewer degrees, so its edges never move more than a couple of pixels.
  const reach = place.size * 0.9;
  const hand = nudge(seed, Math.floor(frame / STEP), 1.4, Math.min(0.9, (1.6 / reach) * 57));
  const scale = place.size / 100;
  const lift = `translate(${1.6 * px} ${2.6 * px})`;
  return (
    <FigureFrame
      {...place}
      style={{ transform: nudged(hand), transformOrigin: `${-FIGURE_BOX.left * scale}px ${-FIGURE_BOX.top * scale}px` }}
      defs={
        <>
          <filter id={`${id}s`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={2.2 * px} />
          </filter>
          <filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={5 * px} />
          </filter>
          <pattern id={`${id}t`} patternUnits="userSpaceOnUse" width={GRAIN_SIZE * px} height={GRAIN_SIZE * px}>
            <image href={GRAIN_TILE} width={GRAIN_SIZE * px} height={GRAIN_SIZE * px} />
          </pattern>
        </>
      }
    >
      {parts.map((p, i) => {
        if (p.kind === "mark") {
          return (
            <text key={i} x={p.x} y={p.y} fontSize={p.size * 1.2} fontFamily={FONT} textAnchor="middle" fill={ink}>
              {p.glyph}
            </text>
          );
        }
        if (p.role === "shadow" && p.kind === "ellipse") {
          return <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry * 1.2} fill="#1E1A14" opacity={0.24} filter={`url(#${id}g)`} />;
        }
        if (p.kind === "stroke") {
          const d = smoothPath(p.points);
          if (p.line) return <path key={i} d={d} fill="none" stroke={p.colour} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round" />;
          // A strip of paper: a tail, a stripe.
          return (
            <g key={i}>
              <path d={d} transform={lift} fill="none" stroke="#1E1A14" strokeOpacity={0.28} strokeWidth={p.width} strokeLinecap="round" filter={`url(#${id}s)`} />
              <path d={d} fill="none" stroke={p.colour} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        }
        const cut = cutOutline(p, Math.imul(seed, 31) + i * 7919, px);
        if (!cut) return null;
        const d = polygonPath(cut.pts);
        return (
          <g key={i}>
            {!FLAT.has(p.role) && <path d={d} transform={lift} fill="#1E1A14" opacity={0.3} filter={`url(#${id}s)`} />}
            {cut.torn && <path d={d} transform={`translate(0 ${-3 * px})`} fill={RIM} />}
            <path d={d} fill={p.fill} />
            {!FLAT.has(p.role) && <path d={d} fill={`url(#${id}t)`} />}
          </g>
        );
      })}
    </FigureFrame>
  );
};
