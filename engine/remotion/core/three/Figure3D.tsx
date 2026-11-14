// Paints character parts (and the demo's park) as lit 3D meshes, for the 3D styles. The parts
// are the same 2D side view every style gets; each becomes a solid (an ellipse a squashed
// sphere, a capsule a capsule, a shape a bevelled slab, a line a tube) drawn back to front in
// the parts' order, so poses and proportions stay exactly those of the shared system.
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import { partBounds } from "../character/parts.js";
import type { FigureProps } from "../character/svg.js";
import type { Part } from "../character/types.js";

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

/** Figure units of space kept around the parts, so bevels and highlights are not cut off. */
const MARGIN = 6;

type Bounds = { left: number; right: number; top: number; bottom: number };

function bounds(parts: Part[]): Bounds {
  const b = parts.filter((p) => p.kind !== "mark").map(partBounds);
  if (b.length === 0) return { left: -1, right: 1, top: -1, bottom: 1 };
  return {
    left: Math.min(...b.map((x) => x.left)) - MARGIN,
    right: Math.max(...b.map((x) => x.right)) + MARGIN,
    top: Math.min(...b.map((x) => x.top)) - MARGIN,
    bottom: Math.max(...b.map((x) => x.bottom)) + MARGIN,
  };
}

const partColour = (p: Part, look: Look3D) => look.colour?.(p) ?? (p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill);

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

const Solids: React.FC<{ parts: Part[]; look: Look3D }> = ({ parts, look }) => {
  const meshes = useMemo(
    () =>
      parts.flatMap((part, i) => {
        if (part.kind === "mark") return [];
        const g = geometry(part, look);
        const colour = partColour(part, look);
        const material =
          part.role === "shadow"
            ? new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.16, depthTest: false, depthWrite: false })
            : // Transparent (at full opacity) so three.js sorts every solid by renderOrder in one list;
              // otherwise the see-through shadows would be drawn after, and over, all the opaque solids.
              new THREE.MeshStandardMaterial({ color: colour, roughness: look.roughness, metalness: 0, flatShading: look.flatShading, transparent: true, depthTest: false, depthWrite: false });
        return [{ key: i, ...g, material }];
      }),
    [parts, look],
  );
  return (
    <>
      {meshes.map((m) => (
        // Drawn in the parts' order without a depth test: the painter's order is the parts' order,
        // as in every 2D style, and each convex solid shades itself from its own normals.
        <mesh key={m.key} geometry={m.geometry} material={m.material} position={[m.position[0], m.position[1], 0]} rotation={[0, 0, m.rotation]} scale={m.scale} renderOrder={m.key} />
      ))}
    </>
  );
};

/** A figure painted in 3D: one small WebGL canvas around the parts, placed like FigureFrame. */
export const Figure3D: React.FC<FigureProps & { look: Look3D }> = ({ parts, x, y, size, look }) => {
  const b = useMemo(() => bounds(parts), [parts]);
  const scale = size / 100;
  const width = Math.max(2, Math.ceil((b.right - b.left) * scale));
  const height = Math.max(2, Math.ceil((b.bottom - b.top) * scale));
  const cx = (b.left + b.right) / 2;
  const cy = -(b.top + b.bottom) / 2;
  const marks = parts.filter((p): p is Extract<Part, { kind: "mark" }> => p.kind === "mark");
  return (
    <>
      <div style={{ position: "absolute", left: x + b.left * scale, top: y + b.top * scale, width, height }}>
        {/* The camera stays on the axis looking straight at the origin, and the parts move so their
            bounds are centred on it: a camera moved off the axis would be turned back to the origin. */}
        <ThreeCanvas width={width} height={height} orthographic flat camera={{ position: [0, 0, 500], zoom: scale, near: 1, far: 1000 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={look.light.ambient} />
          <directionalLight position={[-120, 200, 300]} intensity={look.light.key} />
          <directionalLight position={[200, -50, 200]} intensity={look.light.fill} />
          <group position={[-cx, -cy, 0]}>
            <Solids parts={parts} look={look} />
          </group>
        </ThreeCanvas>
      </div>
      {marks.map((m, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + m.x * scale - m.size * scale,
            top: y + (m.y - m.size) * scale,
            width: m.size * scale * 2,
            textAlign: "center",
            fontFamily: look.font,
            fontWeight: 700,
            fontSize: m.size * scale,
            lineHeight: 1,
            color: partColour(m, look),
          }}
        >
          {m.glyph}
        </div>
      ))}
    </>
  );
};
