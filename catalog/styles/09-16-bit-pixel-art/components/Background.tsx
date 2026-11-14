import { useId, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colour } from "./layout.js";
import { brightness, CELL, ellipse, mix, rasterise, tone } from "./pixels.js";
import { outlineInk, Sprite, Twinkle } from "./shared.js";

const W = 1080;
const H = 1920;
/** Where the sky's bands end. */
const SKY = 1100;
/** The top of the grass ledge the mascot stands on. */
const GROUND = 1170;
/** Dirt tiles, in pixels. */
const TILE = 6 * CELL;

/** A hill line: a sum of slow waves, snapped to the pixel grid. */
const ridge = (x: number, base: number, amp: number, seed: number) =>
  Math.round((base - amp * (0.55 * Math.sin(x / 97 + seed) + 0.3 * Math.sin(x / 41 + seed * 2.3) + 0.15 * Math.sin(x / 19 + seed * 5.1))) / CELL) * CELL;

/** Columns from the ridge down to the ground, as one path, and their lit top cells as another. */
function range(base: number, amp: number, seed: number, step: number): { body: string; top: string } {
  let body = "";
  let top = "";
  for (let x = 0; x < W; x += step) {
    const y = ridge(x, base, amp, seed);
    body += `M${x} ${y}h${step}V${GROUND + CELL}h${-step}z`;
    top += `M${x} ${y}h${step}v${CELL}h${-step}z`;
  }
  return { body, top };
}

/** The grass's ragged lower edge: a fringe of one- and two-cell teeth hanging over the dirt. */
function fringe(): string {
  let d = "";
  for (let x = 0; x < W; x += CELL) {
    const k = (x / CELL) % 5;
    const depth = k === 0 ? 2 : k === 2 || k === 3 ? 1 : 0;
    if (depth) d += `M${x} ${GROUND + 3 * CELL}h${CELL}v${depth * CELL}h${-CELL}z`;
  }
  return d;
}

/** Clouds drifting right at two speeds, in whole pixels; they wrap round. */
const CLOUDS = [
  { x: 620, y: 150, scale: 0.9, every: 14 },
  { x: 80, y: 640, scale: 0.7, every: 22 },
];

/**
 * A 16-bit platformer stage: a sky in flat bands joined by checkerboard dither, a pixel sun
 * (a moon on dark palettes, with twinkling stars), drifting clouds, far mountains, rolling
 * hills, and a grass ledge over checkered dirt where the mascot stands.
 */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const id = `sky${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const key = palette.join(",");
  const night = brightness(colour(palette, 0)) < 0.3;
  const scene = useMemo(() => {
    const bg = colour(palette, 0);
    const ink = outlineInk(palette);
    const green = colour(palette, 2);
    const cloud = mix("#FFFFFF", bg, night ? 0.55 : 0.04);
    const sun = night ? mix("#FFFFFF", colour(palette, 3), 0.25) : colour(palette, 3);
    // Earth from the accent and highlight, darkened: terracotta with the default palette.
    const dirt = tone(mix(colour(palette, 1), colour(palette, 3), 0.5), night ? -0.45 : -0.28);
    return {
      bands: [-0.36, -0.24, -0.13, -0.04, 0.06, 0.17, 0.3].map((k) => tone(bg, k)),
      sun: rasterise([ellipse(0, 0, 13, 13, sun)], { x: 240, y: 186, scale: 5, cell: CELL, outline: ink, shade: true }),
      clouds: CLOUDS.map((c) =>
        rasterise([ellipse(-26, -6, 22, 13, cloud), ellipse(4, -14, 22, 17, cloud), ellipse(30, -5, 20, 12, cloud), ellipse(2, 2, 40, 9, cloud)], {
          x: 0,
          y: 0,
          scale: 3 * c.scale,
          cell: CELL,
          outline: tone(cloud, -0.3),
          shade: true,
        }),
      ),
      hills: [
        { ...range(960, 130, 1.7, 12), colour: mix(bg, tone(green, -0.3), 0.45) },
        { ...range(1110, 70, 4.2, 6), colour: tone(green, -0.12) },
      ],
      grass: green,
      dirt: [dirt, tone(dirt, -0.14)] as [string, string],
      ink,
      stars: night ? Array.from({ length: 22 }, (_, i) => ({ x: ((i * 397) % 1020) + 30, y: ((i * 263) % 900) + 40, phase: i * 7 })) : [],
    };
  }, [key, night]);
  const bandH = Math.round(SKY / scene.bands.length / CELL) * CELL;
  return (
    <AbsoluteFill style={{ backgroundColor: scene.bands.at(-1), overflow: "hidden" }}>
      <svg width={W} height={H} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          {scene.bands.slice(0, -1).map((c, i) => (
            <pattern key={i} id={`${id}-${i}`} width={2 * CELL} height={2 * CELL} patternUnits="userSpaceOnUse">
              <rect width={2 * CELL} height={2 * CELL} fill={c} />
              <rect x={CELL} width={CELL} height={CELL} fill={scene.bands[i + 1]} />
              <rect y={CELL} width={CELL} height={CELL} fill={scene.bands[i + 1]} />
            </pattern>
          ))}
        </defs>
        {scene.bands.map((c, i) => (
          <rect key={i} x={0} y={i * bandH} width={W} height={i === scene.bands.length - 1 ? H : bandH} fill={c} />
        ))}
        {scene.bands.slice(0, -1).map((_, i) => (
          <rect key={`d${i}`} x={0} y={(i + 1) * bandH - 2 * CELL} width={W} height={2 * CELL} fill={`url(#${id}-${i})`} />
        ))}
      </svg>
      {scene.stars.map((s, i) => (
        <Twinkle key={i} x={s.x} y={s.y} colour={mix("#FFFFFF", colour(palette, 3), 0.4)} phase={s.phase} />
      ))}
      <Sprite raster={scene.sun} />
      {CLOUDS.map((c, i) => {
        const travel = Math.floor(frame / c.every) * CELL;
        const x = ((c.x + travel + 200) % (W + 400)) - 200;
        return <Sprite key={i} raster={scene.clouds[i]!} style={{ transform: `translate(${Math.round(x / CELL) * CELL}px, ${c.y}px)` }} />;
      })}
      <svg width={W} height={H} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id={`${id}-dirt`} width={2 * TILE} height={2 * TILE} patternUnits="userSpaceOnUse" y={GROUND}>
            <rect width={2 * TILE} height={2 * TILE} fill={scene.dirt[0]} />
            <rect x={TILE} width={TILE} height={TILE} fill={scene.dirt[1]} />
            <rect y={TILE} width={TILE} height={TILE} fill={scene.dirt[1]} />
          </pattern>
        </defs>
        {scene.hills.map((r, i) => (
          <g key={i}>
            <path d={r.body} fill={r.colour} />
            <path d={r.top} fill={tone(r.colour, 0.28)} />
          </g>
        ))}
        <rect x={0} y={GROUND} width={W} height={H - GROUND} fill={`url(#${id}-dirt)`} />
        {/* The grass casts a one-pixel shadow on the dirt. */}
        <rect x={0} y={GROUND + 3 * CELL} width={W} height={3 * CELL} fill={tone(scene.dirt[1], -0.3)} />
        <rect x={0} y={GROUND - CELL} width={W} height={CELL} fill={scene.ink} />
        <rect x={0} y={GROUND} width={W} height={CELL} fill={tone(scene.grass, 0.32)} />
        <rect x={0} y={GROUND + CELL} width={W} height={2 * CELL} fill={scene.grass} />
        <path d={fringe()} fill={scene.grass} />
      </svg>
    </AbsoluteFill>
  );
};
