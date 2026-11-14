// A tiny flat-shaded 3D renderer for the style's props (gems, the star, the menu cursor):
// a few dozen faces, turned, lit with one light and painted back to front as SVG polygons.
// No WebGL canvas, so the props cost nothing against Chrome's canvas limit.
import type React from "react";
import { useMemo } from "react";
import { lit } from "./colours.js";

export type V3 = [number, number, number];

/** Vertices in model units (about 1), y up, z towards the viewer; each face lists vertex indices. */
export interface Mesh {
  vertices: V3[];
  /** `tint` picks the face's colour from the colours passed to {@link Poly} (0 by default). */
  faces: Array<{ v: number[]; tint?: number }>;
}

/** Rotations in radians, applied in order. */
export type Turn = ["x" | "y" | "z", number];

/** Light from the top left and in front, like the figures' key light. */
const LIGHT: V3 = (() => {
  const v: V3 = [-0.5, 0.62, 0.6];
  const l = Math.hypot(...v);
  return v.map((c) => c / l) as V3;
})();

const turn = (p: V3, [axis, a]: Turn): V3 => {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [x, y, z] = p;
  if (axis === "x") return [x, y * c - z * s, y * s + z * c];
  if (axis === "y") return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
};

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Screen points as an SVG `points` attribute. */
export const pts = (p: Array<[number, number]>) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export interface PolyProps {
  mesh: Mesh;
  /** Screen centre and pixels per model unit. */
  x: number;
  y: number;
  size: number;
  turns: Turn[];
  /** Base colour for each tint. */
  colours: string[];
  /** A dark outline around the silhouette, in pixels. */
  outline?: { width: number; colour: string };
  /** Shade floor: how much light a facet turned away still gets. */
  ambient?: number;
  style?: React.CSSProperties;
}

/** A mesh, turned and flat shaded: each face one colour, lit by how it faces the light. */
export const Poly: React.FC<PolyProps> = ({ mesh, x, y, size, turns, colours, outline, ambient = 0.32, style }) => {
  const reach = useMemo(() => Math.max(...mesh.vertices.map((v) => Math.hypot(...v))), [mesh]);
  const half = Math.ceil(reach * size + (outline?.width ?? 0) + 2);
  const placed = mesh.vertices.map((v) => turns.reduce(turn, v));
  const faces = mesh.faces
    .map((f) => {
      const pts = f.v.map((i) => placed[i]!);
      let n = cross(sub(pts[1]!, pts[0]!), sub(pts[2]!, pts[0]!));
      const centre = pts.reduce<V3>((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);
      // Every mesh here is star-shaped around its origin, so outward normals point away from it.
      if (dot(n, centre) < 0) n = [-n[0], -n[1], -n[2]];
      const len = Math.hypot(...n) || 1;
      n = [n[0] / len, n[1] / len, n[2] / len];
      const light = ambient + (1.12 - ambient) * Math.max(0, dot(n, LIGHT));
      const points = pts.map((p) => `${(half + p[0] * size).toFixed(1)},${(half - p[1] * size).toFixed(1)}`).join(" ");
      return { facing: n[2], depth: centre[2], points, fill: lit(colours[f.tint ?? 0] ?? colours[0]!, light) };
    })
    .filter((f) => f.facing > 0.002)
    .sort((a, b) => a.depth - b.depth);
  return (
    <svg width={half * 2} height={half * 2} style={{ position: "absolute", left: x - half, top: y - half, overflow: "visible", ...style }}>
      {outline && faces.map((f, i) => <polygon key={`o${i}`} points={f.points} fill={outline.colour} stroke={outline.colour} strokeWidth={outline.width * 2} strokeLinejoin="round" />)}
      {faces.map((f, i) => (
        // A hairline in the face's own colour closes the antialiasing seams between facets.
        <polygon key={i} points={f.points} fill={f.fill} stroke={f.fill} strokeWidth={0.8} strokeLinejoin="round" />
      ))}
    </svg>
  );
};

const ring = (n: number, r: number, z: number, offset = 0): V3[] => Array.from({ length: n }, (_, i) => {
  const a = Math.PI / 2 + ((i + offset) / n) * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r, z];
});

/** A cut gem facing the viewer: a flat table, a crown of facets and a pointed back. */
export function gem(n = 8): Mesh {
  const table = ring(n, 0.5, 0.4);
  const girdle = ring(n, 1, 0.06, 0.5);
  const vertices: V3[] = [...table, ...girdle, [0, 0, -0.78]];
  const T = (i: number) => (i + n) % n;
  const G = (i: number) => n + ((i + n) % n);
  const back = 2 * n;
  const faces: Mesh["faces"] = [{ v: table.map((_, i) => i) }];
  for (let i = 0; i < n; i++) {
    faces.push({ v: [T(i), T(i + 1), G(i)], tint: 0 });
    faces.push({ v: [G(i - 1), T(i), G(i)], tint: 1 });
    faces.push({ v: [G(i), G(i + 1), back], tint: 1 });
  }
  return { vertices, faces };
}

/** A chunky star: its outline around the edge, raised to a point in front and behind. */
export function star(points = 5, inner = 0.46, depth = 0.36): Mesh {
  const outline: V3[] = Array.from({ length: points * 2 }, (_, k) => {
    const a = Math.PI / 2 + (k * Math.PI) / points;
    const r = k % 2 === 0 ? 1 : inner;
    return [Math.cos(a) * r, Math.sin(a) * r, 0];
  });
  const front = outline.length;
  const vertices: V3[] = [...outline, [0, 0, depth], [0, 0, -depth]];
  const faces: Mesh["faces"] = [];
  for (let k = 0; k < outline.length; k++) {
    const next = (k + 1) % outline.length;
    faces.push({ v: [front, k, next], tint: k % 2 });
    faces.push({ v: [front + 1, next, k], tint: k % 2 });
  }
  return { vertices, faces };
}

/** A save-point crystal: a six-sided prism with pointed ends, standing upright. */
export function crystal(n = 6, height = 1.7): Mesh {
  const at = (y: number, r: number): V3[] => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
  const vertices: V3[] = [...at(0.35, 0.62), ...at(-0.35, 0.62), [0, height * 0.62, 0], [0, -height * 0.62, 0]];
  const faces: Mesh["faces"] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push({ v: [i, j, n + j, n + i], tint: i % 2 });
    faces.push({ v: [2 * n, j, i], tint: (i + 1) % 2 });
    faces.push({ v: [2 * n + 1, n + i, n + j], tint: i % 2 });
  }
  return { vertices, faces };
}

/** A menu cursor: a thick triangle pointing right. */
export function pointer(): Mesh {
  const tri: Array<[number, number]> = [[1, 0], [-0.62, 0.78], [-0.62, -0.78]];
  const shift = 0.08;
  const vertices: V3[] = [...tri.map(([x, y]): V3 => [x + shift, y, 0.3]), ...tri.map(([x, y]): V3 => [x + shift, y, -0.3])];
  return {
    vertices,
    faces: [
      { v: [0, 1, 2] },
      { v: [3, 5, 4] },
      { v: [0, 3, 4, 1], tint: 1 },
      { v: [1, 4, 5, 2], tint: 1 },
      { v: [2, 5, 3, 0], tint: 1 },
    ],
  };
}
