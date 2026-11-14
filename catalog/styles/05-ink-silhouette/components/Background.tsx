import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { alpha, Bird, luminance, mix, sky, skyAt } from "./shared.js";

/** The sky's bands, thinner towards the horizon (y 1420), like a screen-printed sunset. */
const BANDS = (() => {
  const bands: Array<[number, number]> = [];
  let top = 0;
  let h = 232;
  while (top < 1420) {
    const bottom = Math.min(1420, top + h);
    bands.push([top, bottom]);
    top = bottom;
    h *= 0.86;
  }
  return bands;
})();

const STARS = Array.from({ length: 24 }, (_, i) => ({ x: (i * 397 + 61) % 1040 + 20, y: (i * 233 + 37) % 560 + 30, r: 1.4 + (i % 3) * 0.6, phase: i * 1.7 }));

/** Long thin cloud streaks drifting slowly sideways. */
const STREAKS = [
  { y: 640, w: 560, h: 16, x: 120, v: 0.16 },
  { y: 830, w: 420, h: 12, x: 760, v: 0.1 },
  { y: 1012, w: 680, h: 22, x: 300, v: 0.13 },
  { y: 1108, w: 520, h: 18, x: 900, v: 0.2 },
];

/**
 * Birds crossing the sky slowly, wings beating out of step: two in the high sky, and two pairs
 * against the glow, half a crossing apart, so a pair is always on screen. They keep the picture
 * alive when nothing else moves.
 */
const FLOCK = [
  { x: 40, y: 330, span: 40, v: 0.9, phase: 0 },
  { x: 98, y: 368, span: 30, v: 0.9, phase: 7 },
  { x: 250, y: 1010, span: 66, v: 0.85, phase: 3 },
  { x: 318, y: 1050, span: 50, v: 0.85, phase: 11 },
  { x: 870, y: 968, span: 58, v: 0.85, phase: 5 },
  { x: 928, y: 1002, span: 44, v: 0.85, phase: 14 },
];

/** Jagged ridges along the horizon: the far range, then the near one. */
function ridge(base: number, amp: number, step: number, seed: number): string {
  let d = `M -20 1500 L -20 ${base}`;
  for (let x = 0, i = 0; x <= 1100; x += step, i++) {
    const n = Math.sin(i * 1.9 + seed) * 0.6 + Math.sin(i * 0.7 + seed * 2.3) * 0.4;
    d += ` L ${x} ${(base - amp * (0.5 + 0.5 * n)).toFixed(1)}`;
  }
  return `${d} L 1100 1500 Z`;
}
const FAR = ridge(1300, 110, 60, 1.3);
const NEAR = ridge(1372, 52, 44, 4.1);

/** A setting sun behind distant ridges, under a banded dusk sky with birds, stars and drifting streaks of cloud. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const s = useMemo(() => sky(palette), [palette]);
  const bands = useMemo(() => BANDS.map(([top, bottom]) => ({ top, bottom, fill: skyAt(s, (top + bottom) / 2) })), [s]);
  const starsShow = luminance(s.stops[0]![1]) < 0.25;
  // The sun sinks a little over the whole video.
  const sunY = 1338 + frame * 0.04;
  return (
    <AbsoluteFill style={{ backgroundColor: s.glow, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {bands.map((b) => (
          <rect key={b.top} x={0} y={b.top} width={1080} height={b.bottom - b.top + 1} fill={b.fill} />
        ))}
        {starsShow &&
          STARS.map((st, i) => <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#FFFFFF" opacity={0.25 + 0.3 * (1 + Math.sin(frame / 45 + st.phase)) * (1 - st.y / 700)} />)}
        <circle cx={540} cy={sunY} r={430} fill={alpha(s.sun, 0.06)} />
        <circle cx={540} cy={sunY} r={350} fill={alpha(s.sun, 0.1)} />
        <circle cx={540} cy={sunY} r={290} fill={alpha(s.sun, 0.18)} />
        <circle cx={540} cy={sunY} r={250} fill={s.sun} />
        {STREAKS.map((st, i) => {
          const x = ((st.x + frame * st.v) % (1080 + st.w)) - st.w / 2;
          return <rect key={i} x={x - st.w / 2} y={st.y - st.h / 2} width={st.w} height={st.h} rx={st.h / 2} fill={mix(skyAt(s, st.y), s.ink, 0.42)} />;
        })}
        {FLOCK.map((b, i) => {
          const x = ((b.x + frame * b.v) % 1240) - 80;
          const y = b.y + Math.sin((frame + b.phase * 9) / 40) * 6;
          return <Bird key={i} x={x} y={y} span={b.span} flap={Math.sin((frame + b.phase) / 3.2)} ink={s.ink} width={Math.max(4, b.span / 10)} />;
        })}
        <path d={FAR} fill={s.far} />
        <path d={NEAR} fill={s.near} />
        <rect x={0} y={1392} width={1080} height={528} fill={s.ink} />
      </svg>
    </AbsoluteFill>
  );
};
