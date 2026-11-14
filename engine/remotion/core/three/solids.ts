// The solids a figure is painted with in the 3D styles, built with three.js alone (no React, no
// canvas), so tests can build and free them.
import * as THREE from "three";
import type { Part } from "../character/types.js";
import { splitAlpha } from "./paint.js";

/** How a 3D style shapes and lights its solids. */
export interface Look3D {
  /** Segments around a sphere or capsule: about 32 for smooth clay, 5–8 for low poly. */
  segments: number;
  /** One normal per face (faceted) instead of smooth shading. */
  flatShading: boolean;
  /** 0 glossy … 1 matte. */
  roughness: number;
  /** Depth of a solid as a share of its smaller radius (1 = round, less = flatter). */
  depth: number;
  /** Light from the camera side, the key light from the top left, and the fill. */
  light: { ambient: number; key: number; fill: number };
  /** A colour override for a part (a style's palette), or undefined to keep the part's own. */
  colour?: (part: Part) => string | undefined;
  /** Font for the "!" and "?" marks. */
  font?: string;
}

/** A part's colour, or the style's override for it. */
export const partColour = (p: Part, look: Look3D) => look.colour?.(p) ?? (p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill);

/** The geometry of one part, in figure units with y up (three.js), centred where it belongs. */
function geometry(part: Exclude<Part, { kind: "mark" }>, look: Look3D): { geometry: THREE.BufferGeometry; position: [number, number]; rotation: number; scale: [number, number, number] } {
  const seg = look.segments;
  switch (part.kind) {
    case "ellipse": {
      const flat = part.role === "shadow";
      return {
        geometry: flat ? new THREE.CircleGeometry(1, seg * 2) : new THREE.SphereGeometry(1, seg, Math.max(4, Math.round(seg * 0.75))),
        position: [part.cx, -part.cy],
        rotation: (-part.rotate * Math.PI) / 180,
        scale: [part.rx, part.ry, flat ? 1 : Math.min(part.rx, part.ry) * look.depth],
      };
    }
    case "capsule": {
      const dx = part.x2 - part.x1;
      const dy = -(part.y2 - part.y1);
      const length = Math.hypot(dx, dy);
      return {
        geometry: new THREE.CapsuleGeometry(part.r, length, Math.max(2, Math.round(seg / 4)), seg),
        position: [(part.x1 + part.x2) / 2, -(part.y1 + part.y2) / 2],
        // CapsuleGeometry runs along y; turn it onto the segment.
        rotation: Math.atan2(dy, dx) - Math.PI / 2,
        scale: [1, 1, look.depth],
      };
    }
    case "shape": {
      const shape = new THREE.Shape(part.points.map(([x, y]) => new THREE.Vector2(x, -y)));
      const size = Math.min(...(["x", "y"] as const).map((axis) => {
        const v = part.points.map((p) => (axis === "x" ? p[0] : p[1]));
        return Math.max(...v) - Math.min(...v);
      }));
      const depth = Math.max(1, size * 0.25 * look.depth);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.6, bevelSize: Math.min(depth * 0.5, size * 0.12), bevelSegments: Math.max(1, Math.round(seg / 8)), curveSegments: Math.max(2, Math.round(seg / 3)) });
      geometry.translate(0, 0, -depth / 2);
      return { geometry, position: [0, 0], rotation: 0, scale: [1, 1, 1] };
    }
    case "stroke": {
      const curve = new THREE.CatmullRomCurve3(part.points.map(([x, y]) => new THREE.Vector3(x, -y, 0)));
      return { geometry: new THREE.TubeGeometry(curve, Math.max(8, part.points.length * 6), part.width / 2, Math.max(4, Math.round(seg / 3)), false), position: [0, 0], rotation: 0, scale: [1, 1, look.depth] };
    }
  }
}

/** One solid: a part's geometry and material, placed and turned in figure units. */
export interface Solid {
  key: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: [number, number];
  rotation: number;
  scale: [number, number, number];
}

/** The parts as solids, back to front in the parts' order; marks stay HTML and get none. */
export function buildSolids(parts: Part[], look: Look3D): Solid[] {
  return parts.flatMap((part, i) => {
    if (part.kind === "mark") return [];
    const g = geometry(part, look);
    const { color, opacity } = splitAlpha(partColour(part, look));
    const material =
      part.role === "shadow"
        ? new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.16, depthTest: false, depthWrite: false })
        : // Transparent (usually at full opacity) so three.js sorts every solid by renderOrder in one list;
          // otherwise the see-through shadows would be drawn after, and over, all the opaque solids.
          new THREE.MeshStandardMaterial({ color, opacity, roughness: look.roughness, metalness: 0, flatShading: look.flatShading, transparent: true, depthTest: false, depthWrite: false });
    return [{ key: i, ...g, material }];
  });
}

/**
 * Frees the solids' geometries and materials. The parts change every frame, so every frame
 * builds new solids; three.js keeps the old ones on the GPU until they are disposed.
 */
export function disposeSolids(solids: Solid[]): void {
  for (const solid of solids) {
    solid.geometry.dispose();
    solid.material.dispose();
  }
}
