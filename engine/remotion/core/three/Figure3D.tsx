// Paints character parts (and the demo's park) as lit 3D meshes, for the 3D styles. The parts
// are the same 2D side view every style gets; each becomes a solid (an ellipse a squashed
// sphere, a capsule a capsule, a shape a bevelled slab, a line a tube) drawn back to front in
// the parts' order, so poses and proportions stay exactly those of the shared system.
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useMemo } from "react";
import { partBounds } from "../character/parts.js";
import type { FigureProps } from "../character/svg.js";
import type { Part } from "../character/types.js";
import { buildSolids, disposeSolids, type Look3D, partColour } from "./solids.js";

export type { Look3D } from "./solids.js";

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

const Solids: React.FC<{ parts: Part[]; look: Look3D }> = ({ parts, look }) => {
  const solids = useMemo(() => buildSolids(parts, look), [parts, look]);
  useEffect(() => () => disposeSolids(solids), [solids]);
  return (
    <>
      {solids.map((m) => (
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
