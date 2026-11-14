import type React from "react";
import { FigureFrame, type FigureProps, type Part, partBounds, polygonPath, smoothPath } from "../../../../engine/remotion/kit/index.js";
import { FONT, inks, luminance, MISREGISTER, useSvgId } from "./shared.js";

type Paint = { fill: string; stroke?: string; width?: number };

/** One part's shape in the given paint; capsules and open strokes draw their outline as a wider line underneath. */
function shape(p: Part, key: React.Key, paint: Paint): React.ReactNode {
  const { fill, stroke, width = 0 } = paint;
  switch (p.kind) {
    case "ellipse":
      return (
        <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} transform={p.rotate ? `rotate(${p.rotate} ${p.cx} ${p.cy})` : undefined} fill={fill} stroke={stroke} strokeWidth={stroke ? width : undefined} />
      );
    case "shape":
      return <path key={key} d={polygonPath(p.points)} fill={fill} stroke={stroke} strokeWidth={stroke ? width : undefined} strokeLinejoin="round" />;
    case "capsule":
      return (
        <g key={key}>
          {stroke && <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={stroke} strokeWidth={p.r * 2 + width * 2} strokeLinecap="round" />}
          <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={fill} strokeWidth={p.r * 2} strokeLinecap="round" />
        </g>
      );
    case "stroke": {
      const d = smoothPath(p.points);
      return (
        <g key={key}>
          {stroke && <path d={d} fill="none" stroke={stroke} strokeWidth={p.width + width * 2} strokeLinecap="round" strokeLinejoin="round" />}
          <path d={d} fill="none" stroke={fill} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    case "mark":
      return (
        <text key={key} x={p.x} y={p.y} fontSize={p.size * 1.15} fontFamily={FONT} textAnchor="middle" fill={fill}>
          {p.glyph}
        </text>
      );
  }
}

const colourOf = (p: Part): string => (p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill);
/** Eyes, noses and other near-black parts are printed with the ink plate, not the colour plates. */
const inky = (p: Part): boolean => p.kind === "mark" || (p.kind === "stroke" && p.line) || luminance(colourOf(p)) < 0.16;
const solid = (p: Part): boolean => p.role !== "shadow" && p.role !== "eye-shine" && !inky(p);
/**
 * How a part takes the shading dots: round parts a crescent on the side away from the light,
 * ground planes (wider than 400 units) an even light tint, limbs and lines none.
 */
const shading = (p: Part, light: string): string => {
  if (p.role === "cheek" || (p.kind !== "ellipse" && p.kind !== "shape")) return "#000000";
  const b = partBounds(p);
  return b.right - b.left < 400 ? light : "#707070";
};

/**
 * Characters and the demo's park printed like an old comic: flat colour plates set a few
 * pixels off the thick ink lines, dot-screen shading on the side away from the light, and
 * dotted ground shadows. The ink plate is a mask, so a part in front hides the lines behind it.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const id = useSvgId("fig");
  const line = inks(palette).line;
  const scale = place.size / 100;
  // Line width, misregistration and dot pitch are set in screen pixels, then turned into figure units.
  const lw = Math.min(9, Math.max(4.5, 2.4 * scale)) / scale;
  const off = { x: MISREGISTER.x * 0.7 / scale, y: MISREGISTER.y * 0.7 / scale };
  const pitch = 7 / scale;
  const b = parts.reduce(
    (acc, p) => {
      const q = partBounds(p);
      return { left: Math.min(acc.left, q.left), right: Math.max(acc.right, q.right), top: Math.min(acc.top, q.top), bottom: Math.max(acc.bottom, q.bottom) };
    },
    { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
  );
  if (!Number.isFinite(b.left)) return null;
  const pad = lw * 2 + Math.abs(off.x) + Math.abs(off.y) + 2;
  const area = { x: b.left - pad, y: b.top - pad, width: b.right - b.left + 2 * pad, height: b.bottom - b.top + 2 * pad };
  const shadows = parts.filter((p) => p.role === "shadow");
  const colourParts = parts.filter(solid);
  const keyParts = parts.filter((p) => p.role !== "shadow" && p.role !== "cheek" && p.role !== "eye-shine");
  const defs = (
    <>
      <pattern id={`${id}-dots`} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx={pitch / 2} cy={pitch / 2} r={pitch * 0.3} fill={line} />
      </pattern>
      <radialGradient id={`${id}-light`} cx={0.34} cy={0.28} r={0.82}>
        <stop offset={0} stopColor="#000000" />
        <stop offset={0.7} stopColor="#000000" />
        <stop offset={0.7} stopColor="#FFFFFF" />
        <stop offset={1} stopColor="#FFFFFF" />
      </radialGradient>
      <mask id={`${id}-shade`} maskUnits="userSpaceOnUse" {...area}>
        {colourParts.map((p, i) => shape(p, i, { fill: shading(p, `url(#${id}-light)`) }))}
      </mask>
      <mask id={`${id}-key`} maskUnits="userSpaceOnUse" {...area}>
        {keyParts.map((p, i) => {
          if (p.kind === "mark") return shape(p, i, { fill: "#FFFFFF" });
          if (p.kind === "stroke" && p.line) return shape({ ...p, width: p.width * 1.2 }, i, { fill: "#FFFFFF" });
          if (p.kind === "stroke" && p.role === "pattern") return null;
          return shape(p, i, { fill: inky(p) ? "#FFFFFF" : "#000000", stroke: "#FFFFFF", width: lw });
        })}
      </mask>
    </>
  );
  return (
    <FigureFrame {...place} defs={defs}>
      {shadows.map((p, i) => shape(p, `s${i}`, { fill: `url(#${id}-dots)` }))}
      <g transform={`translate(${off.x} ${off.y})`}>
        {colourParts.map((p, i) => shape(p, i, { fill: colourOf(p) }))}
        <rect {...area} fill={`url(#${id}-dots)`} opacity={0.55} mask={`url(#${id}-shade)`} />
      </g>
      <rect {...area} fill={line} mask={`url(#${id}-key)`} />
      {parts.filter((p) => p.role === "eye-shine").map((p, i) => shape(p, `e${i}`, { fill: "#FFFFFF" }))}
    </FigureFrame>
  );
};
