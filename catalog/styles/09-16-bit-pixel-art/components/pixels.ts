// Rasterises character parts onto a grid of square screen pixels, the way a 16-bit sprite is
// drawn: each cell takes the colour of the frontmost part over its centre, solid parts get a
// lit top row and a shaded bottom row, the silhouette gets a one-cell outline, and ground
// shadows are a checkerboard dither. Pure, so it runs (and is tested) without a browser.
import type { Part } from "../../../../engine/remotion/core/character/types.js";

/** The style's pixel: every sprite, border and step of motion sits on this grid. */
export const CELL = 6;

/** Big sprites (the coin, the ending signs) use double pixels, like a 16-bit game's scaled-up boss. */
export const BIG = CELL * 2;

export type Pt = [number, number];
type RGBA = [number, number, number, number];

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;
const RGB_FN = /^rgba?\(([^)]+)\)$/i;

/** A CSS colour (#RGB, #RRGGBB, rgb() or rgba()) as channels, or undefined. */
export function parseColour(c: string): RGBA | undefined {
  let m = HEX6.exec(c);
  if (m) {
    const n = Number.parseInt(m[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  m = HEX3.exec(c);
  if (m) return [...m[1]!].map((d) => Number.parseInt(d + d, 16)).concat(1) as RGBA;
  m = RGB_FN.exec(c);
  if (m) {
    const v = m[1]!.split(",").map((s) => Number.parseFloat(s));
    return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 1];
  }
  return undefined;
}

/** A colour on the 16-bit consoles' 15-bit grid (5 bits a channel), as #RRGGBB. */
export function snes([r, g, b]: [number, number, number] | RGBA): string {
  const q = (v: number) => Math.min(248, Math.max(0, Math.round(v / 8) * 8));
  return `#${[r, g, b].map((v) => q(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Lighter towards white (amount > 0) or darker towards black (amount < 0), on the 15-bit grid. */
export function tone(c: string, amount: number): string {
  const p = parseColour(c);
  if (!p) return c;
  const t = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  return snes([p[0] + (t - p[0]) * a, p[1] + (t - p[1]) * a, p[2] + (t - p[2]) * a]);
}

/** `a` mixed towards `b` by `t`, on the 15-bit grid. */
export function mix(a: string, b: string, t: number): string {
  const [p, q] = [parseColour(a), parseColour(b)];
  if (!p || !q) return a;
  return snes([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
}

/** The colour at opacity `alpha`, as rgba(). */
export function translucent(c: string, alpha: number): string {
  const p = parseColour(c);
  return p ? `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${alpha})` : c;
}

/** Relative brightness, 0 (black) … 1 (white). */
export function brightness(c: string): number {
  const p = parseColour(c);
  return p ? (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255 : 0.5;
}

/** Points along the same Catmull-Rom curve the SVG painters draw through `points`. */
function curve(points: Pt[], closed = false): Pt[] {
  if (points.length < 2) return points;
  const pts = closed ? [points.at(-1)!, ...points, points[0]!, points[1]!] : [points[0]!, ...points, points.at(-1)!];
  const out: Pt[] = [pts[1]!];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1]!, pts[i]!, pts[i + 1]!, pts[i + 2]!];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let s = 1; s <= 8; s++) {
      const t = s / 8;
      const u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
}

const segmentDistance = (px: number, py: number, [ax, ay]: Pt, [bx, by]: Pt): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const insidePolygon = (x: number, y: number, poly: Pt[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

type Solid = Exclude<Part, { kind: "mark" }>;

/** Line work, small features and symbols: never shaded, and at least one cell thick. */
const FEATURES = new Set(["eye", "eye-shine", "nose", "mouth", "brow", "cheek", "mark"]);
const isFeature = (p: Solid) => FEATURES.has(p.role) || (p.kind === "stroke" && p.line);

/** A containment test in figure units, and the part's bounds and a point that is surely on it. */
function tester(p: Solid, minHalf: number): { inside: (u: number, v: number) => boolean; box: [number, number, number, number]; anchor: Pt } {
  switch (p.kind) {
    case "ellipse": {
      const a = (p.rotate * Math.PI) / 180;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      const hx = Math.hypot(p.rx * c, p.ry * s);
      const hy = Math.hypot(p.rx * s, p.ry * c);
      return {
        inside: (u, v) => {
          const dx = u - p.cx;
          const dy = v - p.cy;
          const x = dx * c + dy * s;
          const y = -dx * s + dy * c;
          return (x * x) / (p.rx * p.rx) + (y * y) / (p.ry * p.ry) <= 1;
        },
        box: [p.cx - hx, p.cy - hy, p.cx + hx, p.cy + hy],
        anchor: [p.cx, p.cy],
      };
    }
    case "capsule":
      return {
        inside: (u, v) => segmentDistance(u, v, [p.x1, p.y1], [p.x2, p.y2]) <= p.r,
        box: [Math.min(p.x1, p.x2) - p.r, Math.min(p.y1, p.y2) - p.r, Math.max(p.x1, p.x2) + p.r, Math.max(p.y1, p.y2) + p.r],
        anchor: [(p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2],
      };
    case "stroke": {
      const line = curve(p.points);
      const half = Math.max(p.width / 2, p.line ? minHalf : 0);
      const xs = line.map((q) => q[0]);
      const ys = line.map((q) => q[1]);
      return {
        inside: (u, v) => {
          for (let i = 0; i < line.length - 1; i++) if (segmentDistance(u, v, line[i]!, line[i + 1]!) <= half) return true;
          return false;
        },
        box: [Math.min(...xs) - half, Math.min(...ys) - half, Math.max(...xs) + half, Math.max(...ys) + half],
        anchor: line[Math.floor(line.length / 2)]!,
      };
    }
    case "shape": {
      const xs = p.points.map((q) => q[0]);
      const ys = p.points.map((q) => q[1]);
      const n = p.points.length;
      return {
        inside: (u, v) => insidePolygon(u, v, p.points),
        box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
        anchor: [xs.reduce((a, b) => a + b, 0) / n, ys.reduce((a, b) => a + b, 0) / n],
      };
    }
  }
}

export interface RasterOptions {
  /** Screen position of the parts' origin (a figure's ground point), in pixels. */
  x: number;
  y: number;
  /** Screen pixels per figure unit. */
  scale: number;
  /** Cell size in screen pixels; the grid is anchored at the screen's origin. */
  cell?: number;
  /** The silhouette's outline colour (none if undefined). */
  outline?: string;
  /** Lit top rows and shaded bottom rows on solid parts. */
  shade?: boolean;
  /** Colour of the dithered ground shadows. */
  shadow?: string;
  /** Overrides a part's colour (a style palette). */
  colour?: (part: Solid) => string | undefined;
}

/** The painted cells, as one SVG path of unit squares per colour, in screen pixels. */
export interface Raster {
  x: number;
  y: number;
  width: number;
  height: number;
  paths: Array<{ colour: string; d: string }>;
}

const EMPTY = -1;

/** Rasterises parts (marks excluded) onto the cell grid. */
export function rasterise(parts: Part[], o: RasterOptions): Raster {
  const cell = o.cell ?? CELL;
  const solids = parts.filter((p): p is Solid => p.kind !== "mark");
  const minHalf = (cell * 0.5) / o.scale;
  const tests = solids.map((p) => tester(p, minHalf));
  if (tests.length === 0) return { x: 0, y: 0, width: 0, height: 0, paths: [] };
  // Cell range covering every part, plus one cell of room for the outline.
  const toCellX = (u: number) => (o.x + u * o.scale) / cell;
  const toCellY = (v: number) => (o.y + v * o.scale) / cell;
  const i0 = Math.floor(Math.min(...tests.map((t) => toCellX(t.box[0])))) - 1;
  const j0 = Math.floor(Math.min(...tests.map((t) => toCellY(t.box[1])))) - 1;
  const i1 = Math.ceil(Math.max(...tests.map((t) => toCellX(t.box[2])))) + 1;
  const j1 = Math.ceil(Math.max(...tests.map((t) => toCellY(t.box[3])))) + 1;
  const cols = i1 - i0 + 1;
  const rows = j1 - j0 + 1;
  const owner = new Int32Array(cols * rows).fill(EMPTY);
  const paint: Array<string | undefined> = new Array(cols * rows);
  const counts = new Array<number>(solids.length).fill(0);
  const isShadow = solids.map((p) => p.role === "shadow");

  solids.forEach((p, k) => {
    const t = tests[k]!;
    const raw = o.colour?.(p) ?? (p.kind === "stroke" ? p.colour : p.fill);
    const rgba = parseColour(raw);
    // An eye's glint only fits when the eye is several cells across.
    if (p.role === "eye-shine" && p.kind === "ellipse" && p.rx * 2 * o.scale < cell * 1.5) return;
    const a = Math.max(i0, Math.floor(toCellX(t.box[0]))) - i0;
    const b = Math.min(i1, Math.ceil(toCellX(t.box[2]))) - i0;
    const c = Math.max(j0, Math.floor(toCellY(t.box[1]))) - j0;
    const d = Math.min(j1, Math.ceil(toCellY(t.box[3]))) - j0;
    const put = (idx: number, gi: number, gj: number) => {
      if (isShadow[k]) {
        if ((gi + gj) % 2 !== 0 || owner[idx] !== EMPTY) return;
        owner[idx] = k;
        paint[idx] = o.shadow ?? "#000000";
      } else if (rgba && rgba[3] < 1) {
        // See-through parts (blush) mix into whatever is under them.
        const under = paint[idx] && owner[idx] !== EMPTY && !isShadow[owner[idx]!] ? parseColour(paint[idx]!) : undefined;
        if (!under) return;
        paint[idx] = snes([0, 1, 2].map((ch) => under[ch]! + (rgba[ch]! - under[ch]!) * rgba[3]) as [number, number, number]);
        return;
      } else {
        owner[idx] = k;
        paint[idx] = rgba ? snes(rgba) : raw;
      }
      counts[k]!++;
    };
    for (let j = c; j <= d; j++) {
      const v = ((j0 + j + 0.5) * cell - o.y) / o.scale;
      for (let i = a; i <= b; i++) {
        const u = ((i0 + i + 0.5) * cell - o.x) / o.scale;
        if (t.inside(u, v)) put(j * cols + i, i0 + i, j0 + j);
      }
    }
    // A feature smaller than a cell still shows as one cell.
    if (counts[k] === 0 && !isShadow[k] && p.role !== "eye-shine") {
      const i = Math.floor(toCellX(t.anchor[0])) - i0;
      const j = Math.floor(toCellY(t.anchor[1])) - j0;
      if (i >= 0 && i < cols && j >= 0 && j < rows) put(j * cols + i, i0 + i, j0 + j);
    }
  });

  const final = paint.slice();
  const solidAt = (i: number, j: number) => i >= 0 && j >= 0 && i < cols && j < rows && owner[j * cols + i]! !== EMPTY && !isShadow[owner[j * cols + i]!];

  // A character's limbs and head shade one by one, so they stay apart where they overlap;
  // scenery (clouds, leaves) shades as one blob wherever its pieces share a colour.
  const sameRegion = (a: number, b: number): boolean => {
    const [p, q] = [owner[a]!, owner[b]!];
    if (p === q) return true;
    if (p === EMPTY || q === EMPTY || isShadow[q]) return false;
    return solids[p]!.role === "prop" && solids[q]!.role === "prop" && paint[a] === paint[b];
  };
  if (o.shade) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;
        const k = owner[idx]!;
        if (k === EMPTY || isShadow[k] || isFeature(solids[k]!) || counts[k]! < 10) continue;
        if (j === 0 || !sameRegion(idx, idx - cols)) final[idx] = tone(paint[idx]!, 0.24);
        else if (j === rows - 1 || !sameRegion(idx, idx + cols)) final[idx] = tone(paint[idx]!, -0.26);
      }
    }
  }
  if (o.outline) {
    const ink = parseColour(o.outline);
    const outline = ink ? snes(ink) : o.outline;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (solidAt(i, j)) continue;
        if (solidAt(i - 1, j) || solidAt(i + 1, j) || solidAt(i, j - 1) || solidAt(i, j + 1)) final[j * cols + i] = outline;
      }
    }
  }

  // Runs of equal colour along each row, one path per colour.
  const runs = new Map<string, string[]>();
  for (let j = 0; j < rows; j++) {
    let i = 0;
    while (i < cols) {
      const c = final[j * cols + i];
      if (!c) {
        i++;
        continue;
      }
      let end = i + 1;
      while (end < cols && final[j * cols + end] === c) end++;
      const list = runs.get(c) ?? [];
      list.push(`M${i * cell} ${j * cell}h${(end - i) * cell}v${cell}h${-(end - i) * cell}z`);
      runs.set(c, list);
      i = end;
    }
  }
  return { x: i0 * cell, y: j0 * cell, width: cols * cell, height: rows * cell, paths: [...runs].map(([colour, d]) => ({ colour, d: d.join("") })) };
}

/** Snaps a screen position to the cell grid. */
export const snap = (v: number, cell = CELL): number => Math.round(v / cell) * cell;

// Parts for the style's own sprites (the sun, clouds, the coin, the ending signs).

export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, rotate = 0): Part => ({ kind: "ellipse", role: "prop", cx, cy, rx, ry, rotate, fill });

export const shape = (points: Pt[], fill: string): Part => ({ kind: "shape", role: "prop", points, fill });

/** A five-pointed star of radius `r`, centred on 0. */
export const star = (r: number, fill: string): Part =>
  shape(
    Array.from({ length: 10 }, (_, k): Pt => {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const d = k % 2 === 0 ? r : r * 0.46;
      return [Math.cos(a) * d, Math.sin(a) * d];
    }),
    fill,
  );
