import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colour } from "./layout.js";
import { shade } from "./shared.js";

type Toy = { kind: "torus" | "sphere" | "capsule" | "box"; x: number; y: number; size: number; role: 1 | 2 | 3; spin: number; phase: number };

/** Clay toys floating at the edges, clear of the text column (x 110–890) and the captions' middle. */
const TOYS: Toy[] = [
  { kind: "sphere", x: 120, y: 190, size: 62, role: 3, spin: 0, phase: 0 },
  { kind: "torus", x: 990, y: 250, size: 80, role: 1, spin: 0.012, phase: 30 },
  { kind: "capsule", x: 50, y: 1000, size: 44, role: 2, spin: 0.01, phase: 60 },
  { kind: "sphere", x: 1015, y: 1130, size: 38, role: 1, spin: 0, phase: 90 },
  { kind: "box", x: 150, y: 1720, size: 110, role: 2, spin: 0.008, phase: 20 },
  { kind: "torus", x: 930, y: 1760, size: 96, role: 3, spin: -0.01, phase: 50 },
];

const Geometry: React.FC<{ toy: Toy }> = ({ toy }) => {
  const s = toy.size;
  switch (toy.kind) {
    case "torus":
      return <torusGeometry args={[s, s * 0.38, 32, 64]} />;
    case "sphere":
      return <sphereGeometry args={[s, 48, 32]} />;
    case "capsule":
      return <capsuleGeometry args={[s, s * 2.2, 12, 32]} />;
    case "box":
      return <boxGeometry args={[s, s, s, 1, 1, 1]} />;
  }
};

/** A soft lit backdrop: a pale glow behind the middle and a few clay toys drifting at the edges. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const bg = colour(palette, 0);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 38%, ${shade(bg, 0.45)} 0%, ${bg} 62%, ${shade(bg, -0.07)} 100%)` }}>
      <ThreeCanvas width={1080} height={1920} orthographic flat camera={{ position: [0, 0, 1000], zoom: 1, near: 1, far: 3000 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.25} />
        <directionalLight position={[-400, 700, 600]} intensity={2.1} />
        <directionalLight position={[500, -200, 400]} intensity={0.7} />
        {TOYS.map((toy, i) => {
          const bob = Math.sin(((frame + toy.phase) / 90) * Math.PI * 2) * 14;
          return (
            <mesh key={i} position={[toy.x - 540, 960 - toy.y + bob, 0]} rotation={[0.5 + frame * toy.spin, 0.6 + frame * toy.spin * 1.3, i * 0.7]}>
              <Geometry toy={toy} />
              <meshStandardMaterial color={colour(palette, toy.role)} roughness={0.85} metalness={0} />
            </mesh>
          );
        })}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
