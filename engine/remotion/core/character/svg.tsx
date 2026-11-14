// Helpers for styles that paint characters as SVG: the figure's frame on screen, smooth
// paths through part points, and a plain painter that a style can build on.
import type React from "react";
import { FIGURE_BOX, type Part } from "./types.js";

type Pt = [number, number];

/** Where a figure stands on screen and how big it is. */
export interface FigurePlacement {
  /** Screen position of the ground point under the character, in pixels. */
  x: number;
  y: number;
  /** Pixels per 100 figure units: about the character's height. */
  size: number;
  /** 1 faces right, -1 faces left. */
  facing?: 1 | -1;
}

/** What a style's Figure component receives: the parts to paint and where. */
export interface FigureProps extends FigurePlacement {
  parts: Part[];
  palette: string[];
}

/** Mirrors parts left to right (marks keep reading the right way round). */
export function mirrorParts(parts: Part[]): Part[] {
  return parts.map((p): Part => {
    switch (p.kind) {
      case "ellipse":
        return { ...p, cx: -p.cx, rotate: -p.rotate };
      case "capsule":
        return { ...p, x1: -p.x1, x2: -p.x2 };
      case "stroke":
      case "shape":
        return { ...p, points: p.points.map(([x, y]) => [-x, y] as Pt) };
      case "mark":
        return { ...p, x: -p.x };
    }
  });
}

/** A smooth SVG path through the points (Catmull-Rom as cubic Béziers). */
export function smoothPath(points: Pt[], closed = false): string {
  if (points.length < 2) return "";
  const pts = closed ? [points.at(-1)!, ...points, points[0]!, points[1]!] : [points[0]!, ...points, points.at(-1)!];
  const f = (n: number) => n.toFixed(2);
  let d = `M ${f(pts[1]![0])} ${f(pts[1]![1])}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1]!, pts[i]!, pts[i + 1]!, pts[i + 2]!];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

/** A straight-edged SVG path through the points. */
export const polygonPath = (points: Pt[], closed = true) => `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")}${closed ? " Z" : ""}`;

/**
 * An absolutely placed SVG whose user units are figure units, mirrored when the
 * figure faces left. Children paint the parts.
 */
export const FigureFrame: React.FC<FigurePlacement & { children: React.ReactNode; defs?: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, size, children, defs, style }) => {
  const scale = size / 100;
  const w = (FIGURE_BOX.right - FIGURE_BOX.left) * scale;
  const h = (FIGURE_BOX.bottom - FIGURE_BOX.top) * scale;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`${FIGURE_BOX.left} ${FIGURE_BOX.top} ${FIGURE_BOX.right - FIGURE_BOX.left} ${FIGURE_BOX.bottom - FIGURE_BOX.top}`}
      style={{ position: "absolute", left: x + FIGURE_BOX.left * scale, top: y + FIGURE_BOX.top * scale, overflow: "visible", ...style }}
    >
      {defs && <defs>{defs}</defs>}
      {children}
    </svg>
  );
};

/** Paint options for {@link plainPart}. */
export interface PlainPaint {
  /** Overrides the part's own colour. */
  fill?: (part: Part) => string | undefined;
  /** An outline around filled parts, in figure units. */
  outline?: { width: number; colour: string };
  /** Straight edges instead of smooth curves for shapes. */
  angular?: boolean;
  font?: string;
  /** Extra SVG attributes for every element (a filter, an opacity). */
  extra?: React.SVGProps<SVGElement>;
}

/**
 * A part as plain SVG: flat fills, optional outline. Capsules are thick round-capped
 * lines, so an outline is the same line drawn wider underneath.
 */
export function plainPart(part: Part, key: React.Key, paint: PlainPaint = {}): React.ReactNode {
  const colour = paint.fill?.(part) ?? (part.kind === "stroke" || part.kind === "mark" ? part.colour : part.fill);
  const o = part.role === "shadow" || part.role === "eye-shine" || part.role === "cheek" ? undefined : paint.outline;
  const extra = paint.extra as Record<string, unknown> | undefined;
  switch (part.kind) {
    case "ellipse":
      return (
        <ellipse
          key={key}
          cx={part.cx}
          cy={part.cy}
          rx={part.rx}
          ry={part.ry}
          transform={part.rotate ? `rotate(${part.rotate} ${part.cx} ${part.cy})` : undefined}
          fill={colour}
          stroke={o?.colour}
          strokeWidth={o?.width}
          {...extra}
        />
      );
    case "capsule":
      return (
        <g key={key} {...extra}>
          {o && <line x1={part.x1} y1={part.y1} x2={part.x2} y2={part.y2} stroke={o.colour} strokeWidth={part.r * 2 + o.width * 2} strokeLinecap="round" />}
          <line x1={part.x1} y1={part.y1} x2={part.x2} y2={part.y2} stroke={colour} strokeWidth={part.r * 2} strokeLinecap="round" />
        </g>
      );
    case "stroke": {
      const d = smoothPath(part.points);
      const line = <path d={d} fill="none" stroke={colour} strokeWidth={part.width} strokeLinecap="round" strokeLinejoin="round" />;
      // A tail is part of the body, so it gets the outline; line work and markings don't.
      if (!o || part.line || part.role === "pattern") return <g key={key} {...extra}>{line}</g>;
      return (
        <g key={key} {...extra}>
          <path d={d} fill="none" stroke={o.colour} strokeWidth={part.width + o.width * 2} strokeLinecap="round" strokeLinejoin="round" />
          {line}
        </g>
      );
    }
    case "shape":
      return (
        <path
          key={key}
          d={paint.angular ? polygonPath(part.points) : smoothPath(part.points, true)}
          fill={colour}
          stroke={o?.colour}
          strokeWidth={o?.width}
          strokeLinejoin="round"
          {...extra}
        />
      );
    case "mark":
      return (
        <text key={key} x={part.x} y={part.y} fontSize={part.size} fontFamily={paint.font} fontWeight={700} textAnchor="middle" fill={colour} {...extra}>
          {part.glyph}
        </text>
      );
  }
}
