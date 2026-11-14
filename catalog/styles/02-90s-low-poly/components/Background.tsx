import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { lit, mix, tone } from "./colours.js";
import { colour } from "./layout.js";
import { cross, crystal, dot, Poly, pts, sub, type V3 } from "./poly.js";
import { shadowInk } from "./shared.js";

type P = [number, number];

/** A repeatable pseudo-random number in 0..1 for an integer seed. */
const noise = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** The sky's colour at height y: deep at the top, the background in the middle, warm at the horizon. */
function skyAt(y: number, palette: string[]): string {
  const bg = colour(palette, 0);
  const stops: Array<[number, string]> = [
    [0, tone(bg, -0.38)],
    [760, bg],
    [1180, mix(bg, colour(palette, 3), 0.5)],
    [1500, mix(bg, colour(palette, 1), 0.45)],
  ];
  const i = stops.findIndex(([at]) => at > y);
  if (i === -1) return stops.at(-1)![1];
  if (i === 0) return stops[0]![1];
  const [[y0, c0], [y1, c1]] = [stops[i - 1]!, stops[i]!];
  return mix(c0, c1, (y - y0) / (y1 - y0));
}

/** Light on the sky's facets, from the top left (screen y is down). */
const SKY_LIGHT: V3 = [-0.45, -0.55, 0.7];

/** A jittered grid split into triangles; each is flat-shaded from a bumpy height field so the sky reads as facets. */
function skyMesh(palette: string[]): Array<{ points: string; fill: string }> {
  const cols = 7;
  const rows = 13;
  const cw = 1160 / (cols - 1);
  const rh = 2000 / (rows - 1);
  const v = (i: number, j: number): V3 => {
    const edgeX = i === 0 || i === cols - 1;
    const edgeY = j === 0 || j === rows - 1;
    const jx = edgeX ? 0 : (noise(i * 31 + j * 7) - 0.5) * cw * 0.7;
    const jy = edgeY ? 0 : (noise(i * 13 + j * 17 + 5) - 0.5) * rh * 0.7;
    return [-40 + i * cw + jx, -40 + j * rh + jy, (noise(i * 71 + j * 29 + 3) - 0.5) * 110];
  };
  const tris: Array<{ points: string; fill: string }> = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const [a, b, c, d] = [v(i, j), v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)];
      const halves = (i + j) % 2 === 0 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const t of halves) {
        const [p, q, r] = t as [V3, V3, V3];
        // The facet's normal from the height field, against a light from the top left.
        const n = cross(sub(q, p), sub(r, p));
        const facing = Math.abs(dot(n, SKY_LIGHT) / (Math.hypot(...n) || 1));
        const cy = (p[1] + q[1] + r[1]) / 3;
        tris.push({ points: pts([[p[0], p[1]], [q[0], q[1]], [r[0], r[1]]]), fill: lit(skyAt(cy, palette), 0.86 + 0.24 * facing) });
      }
    }
  }
  return tris;
}

/** A mountain range: each slope two flat facets, lit when it faces left, then a dark foot to the bottom. */
function range(ridge: P[], base: string, seed: number): Array<{ points: string; fill: string }> {
  const out: Array<{ points: string; fill: string }> = [];
  const mid = ridge.map(([x, y], k): P => [x + (noise(seed + k) - 0.5) * 40, y + (1960 - y) * 0.32 + noise(seed + k * 3) * 50]);
  for (let k = 0; k < ridge.length - 1; k++) {
    const [r0, r1, m0, m1] = [ridge[k]!, ridge[k + 1]!, mid[k]!, mid[k + 1]!];
    const facesLight = r1[1] < r0[1];
    out.push({ points: pts([r0, r1, m1]), fill: lit(base, facesLight ? 1.12 : 0.62) });
    out.push({ points: pts([r0, m1, m0]), fill: lit(base, facesLight ? 0.94 : 0.55) });
    out.push({ points: pts([m0, m1, [m1[0], 1960], [m0[0], 1960]]), fill: lit(base, k % 2 === 0 ? 0.5 : 0.44) });
  }
  return out;
}

const FAR: P[] = [[-60, 1250], [90, 1120], [230, 1210], [380, 1070], [520, 1190], [640, 1130], [780, 1230], [930, 1060], [1140, 1200]];
const NEAR: P[] = [[-60, 1360], [140, 1270], [300, 1400], [470, 1330], [610, 1420], [800, 1300], [960, 1390], [1140, 1290]];

/** Spinning crystals at the edges, clear of the text column (x 110–890). */
const CRYSTALS = [
  { x: 64, y: 196, size: 46, role: 1 as const, phase: 0 },
  { x: 1012, y: 560, size: 40, role: 3 as const, phase: 40 },
  { x: 58, y: 1010, size: 34, role: 2 as const, phase: 80 },
];

const CRYSTAL = crystal();

/** A faceted twilight: a triangle-mesh sky in a gradient, a low-poly sun, two mountain ranges, crystals spinning at the edges. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const key = palette.join(",");
  const scenery = useMemo(() => {
    const bg = colour(palette, 0);
    // A low sun half behind the far range, off to the right of the mascot, blended into the haze.
    const sun = mix(colour(palette, 3), skyAt(1100, palette), 0.3);
    const sunFacets = Array.from({ length: 10 }, (_, i) => {
      const a0 = (i / 10) * Math.PI * 2;
      const a1 = ((i + 1) / 10) * Math.PI * 2;
      const c: P = [905, 1150];
      const r = 135;
      return { points: pts([c, [c[0] + Math.cos(a0) * r, c[1] + Math.sin(a0) * r], [c[0] + Math.cos(a1) * r, c[1] + Math.sin(a1) * r]]), fill: lit(sun, i % 2 === 0 ? 1.08 : 0.94) };
    });
    return {
      sky: skyMesh(palette),
      sun: sunFacets,
      far: range(FAR, mix(tone(bg, -0.1), colour(palette, 2), 0.32), 11),
      near: range(NEAR, mix(tone(bg, -0.55), colour(palette, 2), 0.3), 47),
    };
  }, [key]);
  return (
    <AbsoluteFill style={{ backgroundColor: colour(palette, 0), overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {[...scenery.sky, ...scenery.sun, ...scenery.far, ...scenery.near].map((t, i) => (
          <polygon key={i} points={t.points} fill={t.fill} stroke={t.fill} strokeWidth={1} strokeLinejoin="round" />
        ))}
      </svg>
      {CRYSTALS.map((c, i) => (
        <Poly
          key={i}
          mesh={CRYSTAL}
          x={c.x}
          y={c.y + Math.sin(((frame + c.phase) / 75) * Math.PI * 2) * 12}
          size={c.size}
          turns={[["y", (frame + c.phase) * 0.045], ["x", 0.22]]}
          colours={[colour(palette, c.role), tone(colour(palette, c.role), -0.12)]}
          outline={{ width: 3, colour: shadowInk(palette) }}
        />
      ))}
    </AbsoluteFill>
  );
};
