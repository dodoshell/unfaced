import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colour, HORIZON } from "./layout.js";
import { alpha, core, luminance, mix, night } from "./shared.js";

const W = 1080;
const H = 1920;
/** The sun sits a little above the horizon, so most of it shows. */
const SUN = { cx: 540, cy: HORIZON - 80, r: 300 };
/** Frames for one grid row to reach the next: the floor's speed. */
const ROW_FRAMES = 22;

/** A low-poly mountain range as points along the horizon (x, height above it). */
const RANGES: Array<Array<[number, number]>> = [
  [[-40, 0], [40, 96], [110, 58], [205, 182], [290, 92], [360, 138], [430, 54], [500, 0]],
  [[600, 0], [660, 62], [740, 150], [810, 84], [890, 214], [975, 108], [1040, 160], [1120, 0]],
];

/** Stars in the upper sky, from a fixed scatter. */
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 397 + 61) % W,
  y: 40 + ((i * 233 + 17) % 640) + (i % 3) * 30,
  r: 1.4 + (i % 4) * 0.7,
  phase: i * 1.7,
}));

/**
 * An 80s night: a sky glowing magenta towards the horizon, a striped sun, wireframe mountains
 * and a neon grid floor scrolling towards the viewer, with scanlines over it all.
 */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const bg = colour(palette, 0);
  const accent = colour(palette, 1);
  const secondary = colour(palette, 2);
  const highlight = colour(palette, 3);
  const dark = night(palette);
  const darkSky = luminance(bg) < 0.4;
  const haze = mix(bg, accent, 0.42);

  // The grid: rows at depth z land at y = HORIZON + depth / z, and z shrinks as they come closer.
  const depth = H - HORIZON;
  const phase = (frame % ROW_FRAMES) / ROW_FRAMES;
  const rows = Array.from({ length: 70 }, (_, i) => (i + 1 - phase) * 0.5)
    .filter((z) => z > 0.3)
    .map((z) => ({ y: HORIZON + depth / z, w: Math.min(7, 3.2 / z), o: Math.min(1, (depth / z) / 160) }))
    .filter((r) => r.y < H + 20 && r.y - HORIZON > 3);
  const columns = Array.from({ length: 31 }, (_, i) => i - 15);
  const gridLine = mix(accent, "#FFFFFF", 0.3);

  // Sun stripes slide down and thicken towards the horizon, the classic sunset cut.
  const stripeShift = (frame * 0.5) % 34;
  const stripes = Array.from({ length: 9 }, (_, i) => {
    const y = SUN.cy - 70 + i * 34 + stripeShift;
    const h = 3 + Math.max(0, (y - (SUN.cy - 90)) / 12);
    return { y, h };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="nsw-sky" x1="0" y1="0" x2="0" y2={HORIZON} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={darkSky ? mix(bg, "#000000", 0.35) : mix(bg, "#FFFFFF", 0.3)} />
            <stop offset="0.45" stopColor={bg} />
            <stop offset="0.85" stopColor={mix(bg, accent, 0.28)} />
            <stop offset="1" stopColor={haze} />
          </linearGradient>
          <linearGradient id="nsw-sun" x1="0" y1={SUN.cy - SUN.r} x2="0" y2={HORIZON} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={mix(highlight, "#FFFFFF", 0.25)} />
            <stop offset="0.45" stopColor={mix(highlight, accent, 0.45)} />
            <stop offset="1" stopColor={accent} />
          </linearGradient>
          <radialGradient id="nsw-sun-glow" cx={SUN.cx} cy={SUN.cy} r={SUN.r * 1.75} gradientUnits="userSpaceOnUse">
            <stop offset="0.5" stopColor={alpha(accent, 0.45)} />
            <stop offset="1" stopColor={alpha(accent, 0)} />
          </radialGradient>
          <linearGradient id="nsw-floor" x1="0" y1={HORIZON} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={mix(dark, accent, 0.32)} />
            <stop offset="0.35" stopColor={mix(dark, accent, 0.1)} />
            <stop offset="1" stopColor={dark} />
          </linearGradient>
          <linearGradient id="nsw-fade" x1="0" y1={HORIZON} x2="0" y2={HORIZON + 150} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={alpha(haze, 0.95)} />
            <stop offset="1" stopColor={alpha(haze, 0)} />
          </linearGradient>
          <linearGradient id="nsw-column" x1="0" y1={HORIZON} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={gridLine} stopOpacity={0.15} />
            <stop offset="0.3" stopColor={gridLine} stopOpacity={0.85} />
            <stop offset="1" stopColor={gridLine} stopOpacity={1} />
          </linearGradient>
          <mask id="nsw-sun-cut" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
            {stripes.map((s, i) => (
              <rect key={i} x={0} y={s.y} width={W} height={s.h} fill="#000000" />
            ))}
          </mask>
        </defs>

        <rect x={0} y={0} width={W} height={HORIZON} fill="url(#nsw-sky)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={mix(bg, "#FFFFFF", 0.85)} opacity={0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 11 + s.phase))} />
        ))}

        <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r * 1.75} fill="url(#nsw-sun-glow)" />
        <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill="url(#nsw-sun)" mask="url(#nsw-sun-cut)" />

        {RANGES.map((range, i) => {
          const pts = range.map(([x, h]) => `${x},${HORIZON - h}`).join(" ");
          const peaks = range.filter(([, h]) => h > 0);
          return (
            <g key={i}>
              <polygon points={pts} fill={mix(dark, accent, 0.14)} />
              {peaks.map(([x, h], j) => (
                <line key={j} x1={x} y1={HORIZON - h} x2={x + (j % 2 === 0 ? -1 : 1) * h * 0.35} y2={HORIZON} stroke={secondary} strokeWidth={1.5} opacity={0.4} />
              ))}
              <polyline points={pts} fill="none" stroke={secondary} strokeWidth={10} opacity={0.18} strokeLinejoin="round" />
              <polyline points={pts} fill="none" stroke={secondary} strokeWidth={3} strokeLinejoin="round" />
              <polyline points={pts} fill="none" stroke={core(secondary)} strokeWidth={1.2} strokeLinejoin="round" />
            </g>
          );
        })}

        <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="url(#nsw-floor)" />
        <g strokeLinecap="round">
          {columns.map((k) => (
            <line key={`gc${k}`} x1={SUN.cx + k * 6} y1={HORIZON} x2={SUN.cx + k * 175} y2={H} stroke={accent} strokeWidth={9} opacity={0.16} />
          ))}
          {rows.map((r, i) => (
            <line key={`gr${i}`} x1={0} y1={r.y} x2={W} y2={r.y} stroke={accent} strokeWidth={r.w * 3} opacity={0.2 * r.o} />
          ))}
          {columns.map((k) => (
            <line key={`c${k}`} x1={SUN.cx + k * 6} y1={HORIZON} x2={SUN.cx + k * 175} y2={H} stroke="url(#nsw-column)" strokeWidth={2.4} />
          ))}
          {rows.map((r, i) => (
            <line key={`r${i}`} x1={0} y1={r.y} x2={W} y2={r.y} stroke={gridLine} strokeWidth={r.w} opacity={r.o} />
          ))}
        </g>
        <rect x={0} y={HORIZON} width={W} height={150} fill="url(#nsw-fade)" />
        <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} stroke={accent} strokeWidth={12} opacity={0.3} />
        <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} stroke={core(accent)} strokeWidth={3} />
      </svg>
      {/* Scanlines, and a brighter band rolling down like an old screen's refresh. */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, rgba(0, 0, 0, ${darkSky ? 0.22 : 0.06}) 0px, rgba(0, 0, 0, ${darkSky ? 0.22 : 0.06}) 2px, transparent 2px, transparent 5px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          height: 220,
          top: ((frame * 9) % (H + 440)) - 220,
          background: `linear-gradient(180deg, transparent, ${alpha("#FFFFFF", darkSky ? 0.045 : 0.08)}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
