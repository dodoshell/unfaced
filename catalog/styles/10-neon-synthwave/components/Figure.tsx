import type React from "react";
import { FigureFrame, type FigureProps, type Part, polygonPath, smoothPath } from "../../../../engine/remotion/kit/index.js";
import { colour } from "./layout.js";
import { alpha, core, mix, neon, night, TEXT } from "./shared.js";

/** Tube widths on screen, in pixels, whatever the figure's size. */
const TUBE_PX = 4;
const GLOW_PX = 15;
const HALO_PX = 30;

/** The outline of a filled part as an SVG path, in figure units. */
function outline(p: Part): string | undefined {
  switch (p.kind) {
    case "ellipse": {
      const a = (p.rotate * Math.PI) / 180;
      const [dx, dy] = [p.rx * Math.cos(a), p.rx * Math.sin(a)];
      const arc = `A ${p.rx} ${p.ry} ${p.rotate} 1 0`;
      return `M ${p.cx + dx} ${p.cy + dy} ${arc} ${p.cx - dx} ${p.cy - dy} ${arc} ${p.cx + dx} ${p.cy + dy} Z`;
    }
    case "capsule": {
      // A stadium: two half circles joined by straight sides, so a limb is one closed tube.
      const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1) || 1e-3;
      const [nx, ny] = [(-(p.y2 - p.y1) / len) * p.r, ((p.x2 - p.x1) / len) * p.r];
      const arc = `A ${p.r} ${p.r} 0 0 1`;
      return `M ${p.x1 + nx} ${p.y1 + ny} L ${p.x2 + nx} ${p.y2 + ny} ${arc} ${p.x2 - nx} ${p.y2 - ny} L ${p.x1 - nx} ${p.y1 - ny} ${arc} ${p.x1 + nx} ${p.y1 + ny} Z`;
    }
    case "shape":
      return polygonPath(p.points);
    default:
      return undefined;
  }
}

const base = (p: Part) => (p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill);

/** Big ground pieces (the demo's lawn) are tinted glass, so the grid floor shows through. */
const isGround = (p: Part) => p.kind === "shape" && Math.max(...p.points.map(([x]) => x)) - Math.min(...p.points.map(([x]) => x)) > 600;

/**
 * Characters and the demo's park as neon signs: every part a dark glass shape inside a glowing
 * tube of its own colour (same hue, full brightness). Eyes and line work are bare white-hot tubes,
 * and the ground shadow becomes a pool of light on the grid.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const unit = 100 / place.size;
  const tube = TUBE_PX * unit;
  const dark = night(palette);
  const accent = colour(palette, 1);
  const lit = parts.filter((p) => p.role !== "shadow" && p.role !== "mark" && p.role !== "eye-shine" && p.role !== "cheek");
  const line = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  // The glow goes under everything, so each part's dark glass still covers the parts behind it.
  const glow = lit.map((p, i) => {
    const d = outline(p) ?? (p.kind === "stroke" ? smoothPath(p.points) : undefined);
    if (!d) return null;
    const width = p.kind === "stroke" ? p.width : 0;
    const c = neon(base(p));
    return (
      <g key={`g${i}`}>
        <path d={d} {...line} stroke={c} strokeWidth={width + HALO_PX * unit} opacity={0.13} />
        <path d={d} {...line} stroke={c} strokeWidth={width + GLOW_PX * unit} opacity={0.3} />
      </g>
    );
  });

  const body = parts.map((p, i): React.ReactNode => {
    const c = neon(base(p));
    if (p.role === "shadow" && p.kind === "ellipse") {
      // A pool of light on the floor.
      return (
        <g key={i}>
          <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 1.25} ry={p.ry * 1.9} fill={alpha(neon(accent), 0.16)} />
          <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 0.9} ry={p.ry * 1.1} fill={alpha(neon(accent), 0.28)} />
        </g>
      );
    }
    if (p.role === "eye-shine") return null;
    if (p.role === "cheek" && p.kind === "ellipse") return <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx * 1.2} ry={p.ry * 1.2} fill={alpha(neon("#FF4F9A"), 0.4)} />;
    if (p.kind === "mark") {
      return (
        <text key={i} x={p.x} y={p.y} fontSize={p.size} fontFamily={TEXT} fontWeight={900} textAnchor="middle" fill={core(neon(colour(palette, 3)))} stroke={neon(colour(palette, 3))} strokeWidth={tube * 1.5} paintOrder="stroke">
          {p.glyph}
        </text>
      );
    }
    if (p.kind === "stroke") {
      const d = smoothPath(p.points);
      if (p.line) return <path key={i} d={d} {...line} stroke={core(c)} strokeWidth={Math.max(p.width, tube * 0.9)} />;
      if (p.role === "pattern") return <path key={i} d={d} {...line} stroke={c} strokeWidth={Math.max(p.width * 0.55, tube * 0.6)} opacity={0.85} />;
      // A tail: a dark tube with a lit skin, like a limb.
      return (
        <g key={i}>
          <path d={d} {...line} stroke={c} strokeWidth={p.width + 2 * tube} />
          <path d={d} {...line} stroke={mix(dark, base(p), 0.16)} strokeWidth={p.width} />
          <path d={d} {...line} stroke={core(c)} strokeWidth={tube * 0.35} opacity={0.5} />
        </g>
      );
    }
    const d = outline(p)!;
    if (p.role === "eye" || p.role === "nose") {
      // Eyes and noses are tiny, so they light up whole instead of as an outline.
      return <path key={i} d={d} fill={core(p.role === "eye" ? "#BDF6FF" : c)} stroke={p.role === "eye" ? "#BDF6FF" : c} strokeWidth={tube * 0.6} />;
    }
    const ground = isGround(p);
    return (
      <g key={i}>
        <path d={d} fill={mix(dark, base(p), 0.16)} fillOpacity={ground ? 0.3 : 1} stroke={c} strokeWidth={tube} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={core(c)} strokeWidth={tube * 0.38} strokeLinejoin="round" />
      </g>
    );
  });

  return (
    <FigureFrame {...place}>
      {glow}
      {body}
    </FigureFrame>
  );
};
