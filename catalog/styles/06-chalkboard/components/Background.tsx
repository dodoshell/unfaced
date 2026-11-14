import { useMemo } from "react";
import { AbsoluteFill, Img } from "remotion";
import { chalk, lightBoard, mix } from "./colours.js";
import { colour } from "./layout.js";
import { hash } from "./shared.js";

/** The width of the wooden frame, and the height of the chalk tray at the bottom. */
const FRAME = 22;
const TRAY = 64;

/**
 * The board's chalk dust as one SVG image: fine grain, wide eraser smears and the ghosts of
 * old drawings. It depends only on the palette, so the browser renders it once per video
 * instead of running a turbulence filter on every frame.
 */
function dustImage(dust: string): string {
  // Eraser smears: wide sweeps back and forth, as a hand wipes a board.
  const smears = [
    "M -60 380 C 240 300 300 620 620 520 S 1000 360 1160 560",
    "M 980 760 C 760 980 420 700 160 900 S -40 1120 -60 1040",
    "M -80 1420 C 220 1260 420 1520 700 1380 S 1080 1300 1160 1460",
    "M 700 120 C 820 300 1000 180 1160 260",
  ]
    .map((d, i) => `<path d='${d}' stroke-width='${[150, 200, 170, 130][i]}' opacity='${[0.07, 0.05, 0.06, 0.05][i]}'/>`)
    .join("");
  // Ghosts of rubbed-out handwriting: rows of loops, faint and blurred.
  const ghosts = Array.from({ length: 7 }, (_, i) => {
    const x0 = 90 + hash(i, 1) * 420;
    const y0 = 300 + i * 210 + hash(i, 2) * 80;
    const len = 220 + hash(i, 3) * 380;
    const pts = Array.from({ length: Math.round(len / 6) }, (_, k) => {
      const t = k * 0.55;
      return `${(x0 + k * 6 + Math.sin(t) * 9).toFixed(0)},${(y0 - Math.abs(Math.cos(t * 0.5)) * 22 * (0.6 + hash(i, k) * 0.6)).toFixed(0)}`;
    });
    return `<polyline points='${pts.join(" ")}'/>`;
  }).join("");
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920' viewBox='0 0 1080 1920'>" +
    "<defs>" +
    "<filter id='grain' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='4'/>" +
    "<feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3 0 0 0 -1.62'/></filter>" +
    "<filter id='smear' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='34'/></filter>" +
    "<filter id='ghost' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='2.5'/></filter>" +
    "</defs>" +
    `<g fill='none' stroke='${dust}' stroke-linecap='round' filter='url(#smear)'>${smears}</g>` +
    `<g fill='none' stroke='${dust}' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' opacity='0.06' filter='url(#ghost)'>${ghosts}</g>` +
    `<rect width='1080' height='1920' fill='${dust}' filter='url(#grain)' opacity='0.16'/>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const WOOD = "#7A4D2B";
const wood = (angle: number): React.CSSProperties => ({
  position: "absolute",
  background: `repeating-linear-gradient(${angle}deg, rgba(255,255,255,0.05) 0 3px, rgba(0,0,0,0.06) 3px 9px, rgba(0,0,0,0) 9px 23px), linear-gradient(${angle + 90}deg, ${mix(WOOD, "#FFFFFF", 0.12)}, ${WOOD} 55%, ${mix(WOOD, "#000000", 0.25)})`,
});

/** A green board in a wooden frame, with chalk dust, eraser smears and a tray with chalk at the bottom. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const board = colour(palette, 0);
  const dust = chalk(palette, 4);
  const src = useMemo(() => dustImage(dust), [dust]);
  const edge = lightBoard(palette) ? "rgba(60, 40, 20, 0.18)" : "rgba(0, 0, 0, 0.42)";
  return (
    <AbsoluteFill style={{ backgroundColor: board, overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 140px ${edge}` }} />
      <div style={{ ...wood(90), left: 0, top: 0, width: 1080, height: FRAME }} />
      <div style={{ ...wood(0), left: 0, top: 0, width: FRAME, height: 1920 }} />
      <div style={{ ...wood(0), left: 1080 - FRAME, top: 0, width: FRAME, height: 1920 }} />
      <div style={{ ...wood(90), left: 0, top: 1920 - TRAY, width: 1080, height: TRAY, boxShadow: "0 -6px 12px rgba(0,0,0,0.35)" }} />
      <div style={{ position: "absolute", left: 640, top: 1920 - TRAY - 6, width: 120, height: 18, borderRadius: 9, background: "linear-gradient(#FFFFFF, #DDD8CC)" }} />
      <div style={{ position: "absolute", left: 790, top: 1920 - TRAY - 6, width: 76, height: 18, borderRadius: 9, background: "linear-gradient(#FFF6C8, #F4D774)" }} />
      <div style={{ position: "absolute", left: 150, top: 1920 - TRAY - 30, width: 190, height: 44, borderRadius: 6, background: "linear-gradient(#9C6B42 0 34%, #3B3B44 34% 100%)", boxShadow: "0 4px 6px rgba(0,0,0,0.35)" }} />
    </AbsoluteFill>
  );
};
