import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { inks, mix, rand } from "./shared.js";

/**
 * A halftone screen as one SVG path: dots on a grid turned by `angle` degrees, `pitch` pixels
 * apart, each as big as `radius(x, y)` says (0 leaves the dot out). Built once per screen.
 */
function screen(pitch: number, angle: number, radius: (x: number, y: number) => number): string {
  const a = (angle * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const n = Math.ceil(2300 / pitch);
  let d = "";
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = 540 + (i * c - j * s) * pitch;
      const y = 960 + (i * s + j * c) * pitch;
      if (x < -pitch || x > 1080 + pitch || y < -pitch || y > 1920 + pitch) continue;
      const r = radius(x, y);
      if (r < 0.7) continue;
      d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
    }
  }
  return d;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** The sky: big dots at the top, shrinking to nothing by y 1150. */
const SKY = screen(24, 15, (_, y) => 9 * clamp01((1150 - y) / 1100) ** 0.8);
/** The floor: small dots growing towards the bottom edge, under the captions. */
const FLOOR = screen(22, 75, (_, y) => 7.5 * clamp01((y - 1360) / 560) ** 0.9);
/** Specks and foxing on old paper. */
const SPECKS = Array.from({ length: 150 }, (_, i) => ({ x: rand(i) * 1080, y: rand(i + 500) * 1920, r: 0.6 + 1.6 * rand(i + 900) }));
const STAINS = [
  { x: 160, y: 300, r: 120 },
  { x: 930, y: 760, r: 90 },
  { x: 120, y: 1500, r: 150 },
  { x: 880, y: 1780, r: 110 },
];

/** Old newsprint: a halftone sky and floor, specks and stains, and the page's panel border. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const c = useMemo(() => inks(palette), [palette]);
  const speck = mix(c.paper, c.ink, 0.45);
  const stain = mix(c.paper, "#8A5A1E", 0.16);
  return (
    <AbsoluteFill style={{ backgroundColor: c.paper, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="vintage-comic-stain">
            <stop offset={0} stopColor={stain} stopOpacity={0.7} />
            <stop offset={0.7} stopColor={stain} stopOpacity={0.35} />
            <stop offset={1} stopColor={stain} stopOpacity={0} />
          </radialGradient>
        </defs>
        {STAINS.map((s, i) => (
          <ellipse key={i} cx={s.x} cy={s.y} rx={s.r} ry={s.r * 0.8} fill="url(#vintage-comic-stain)" />
        ))}
        <path d={SKY} fill={c.secondary} opacity={0.85} />
        <path d={FLOOR} fill={c.accent} opacity={0.8} />
        {SPECKS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={speck} opacity={0.55} />
        ))}
        <rect x={22} y={22} width={1036} height={1876} fill="none" stroke={c.ink} strokeWidth={10} />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(110, 72, 20, 0.22) 100%)" }} />
    </AbsoluteFill>
  );
};
