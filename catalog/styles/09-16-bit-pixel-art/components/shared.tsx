import type React from "react";
import { useId, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { loadFont, type Rect } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/PixelifySans.ttf";
import { BORDER, colour } from "./layout.js";
import { brightness, CELL, mix, type Raster, snap, tone } from "./pixels.js";

loadFont("Pixelify Sans", fontUrl, { weight: "400 700" });
export const FONT = "'Pixelify Sans', monospace";

/** Animation runs at 10 fps, like a 16-bit sprite: every value holds for this many frames. */
export const STEP = 3;

/** The frame, held for STEP frames at a time. */
export function useStepFrame(): number {
  const frame = useCurrentFrame();
  return Math.floor(frame / STEP) * STEP;
}

/** A stepped entrance, `delay` frames into the scene: 0, then three steps up to 1 with a one-step overshoot. */
export function stepIn(frame: number, delay = 0): number {
  const k = Math.floor((frame - delay) / STEP);
  return k < 0 ? 0 : ([0.34, 0.67, 1.08][k] ?? 1);
}

/** A two-pose idle bob: one `cell` lower for half the period. Big sprites bob a whole big cell, so they keep their shape. */
export const bob = (frame: number, period = 30, phase = 0, cell = CELL): number => (Math.floor((frame + phase) / (period / 2)) % 2) * cell;

/** The palette's darkest colour, for outlines and drop shadows. */
export function outlineInk(palette: string[]): string {
  const ink = colour(palette, 4);
  const bg = colour(palette, 0);
  if (brightness(ink) < 0.3) return ink;
  if (brightness(bg) < 0.3) return tone(bg, -0.35);
  return "#141420";
}

/** Text boxes: near white with ink text, or deep with light text when the ink is the light colour. */
export function boxColours(palette: string[]): { fill: string; text: string; shadow: string } {
  const ink = colour(palette, 4);
  if (brightness(ink) < 0.5) {
    const fill = mix("#FFFFFF", colour(palette, 0), 0.08);
    return { fill, text: ink, shadow: mix(fill, ink, 0.2) };
  }
  const fill = mix(outlineInk(palette), colour(palette, 0), 0.25);
  return { fill, text: ink, shadow: tone(fill, -0.6) };
}

/** A rectangle with stair-stepped corners `steps` cells deep, as an SVG path. */
export function steppedRect(x: number, y: number, w: number, h: number, steps: number, c = CELL): string {
  if (steps <= 0) return `M${x} ${y}h${w}v${h}h${-w}z`;
  let d = `M${x + steps * c} ${y}H${x + w - steps * c}`;
  for (let s = steps - 1; s >= 0; s--) d += `V${y + (steps - s) * c}H${x + w - s * c}`;
  d += `V${y + h - steps * c}`;
  for (let s = 1; s <= steps; s++) d += `H${x + w - s * c}V${y + h - (steps - s) * c}`;
  d += `H${x + steps * c}`;
  for (let s = steps - 1; s >= 0; s--) d += `V${y + h - (steps - s) * c}H${x + s * c}`;
  d += `V${y + steps * c}`;
  for (let s = 1; s <= steps; s++) d += `H${x + s * c}V${y + (steps - s) * c}`;
  return `${d}Z`;
}

export interface PixelBoxProps {
  box: Rect;
  fill: string;
  /** The border's colour band. */
  border: string;
  ink: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export { BORDER } from "./layout.js";

/**
 * A 16-bit text window: stepped corners, an ink edge, a colour band lit along its top and
 * left and shaded along its bottom and right, an inner ink line, a flat fill and a dithered
 * drop shadow. Children sit inside the border.
 */
export const PixelBox: React.FC<PixelBoxProps> = ({ box, fill, border, ink, style, contentStyle, children }) => {
  const id = `px${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { w, h } = box;
  const c = CELL;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: w, height: h, ...style }}>
      <svg width={w} height={h} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <pattern id={id} width={2 * c} height={2 * c} patternUnits="userSpaceOnUse">
            <rect width={c} height={c} fill={ink} />
            <rect x={c} y={c} width={c} height={c} fill={ink} />
          </pattern>
        </defs>
        <path d={steppedRect(2 * c, 2 * c, w, h, 2)} fill={`url(#${id})`} />
        <path d={steppedRect(0, 0, w, h, 2)} fill={ink} />
        <path d={steppedRect(c, c, w - 2 * c, h - 2 * c, 1)} fill={border} />
        <path d={`M${2 * c} ${c}h${w - 4 * c}v${c}h${-(w - 4 * c)}z M${c} ${2 * c}h${c}v${h - 4 * c}h${-c}z`} fill={tone(border, 0.35)} />
        <path d={`M${2 * c} ${h - 2 * c}h${w - 4 * c}v${c}h${-(w - 4 * c)}z M${w - 2 * c} ${2 * c}h${c}v${h - 4 * c}h${-c}z`} fill={tone(border, -0.32)} />
        <path d={steppedRect(3 * c, 3 * c, w - 6 * c, h - 6 * c, 1)} fill={ink} />
        <rect x={4 * c} y={4 * c} width={w - 8 * c} height={h - 8 * c} fill={fill} />
        <rect x={4 * c} y={4 * c} width={w - 8 * c} height={c} fill={tone(fill, -0.08)} />
      </svg>
      <div style={{ position: "absolute", inset: BORDER, display: "flex", alignItems: "center", ...contentStyle }}>{children}</div>
    </div>
  );
};

/** Pixel lettering with a hard one-step drop shadow. */
export const pixelText = (size: number, fill: string, shadow: string, weight = 600): React.CSSProperties => {
  const d = Math.max(3, Math.round(size / 16));
  return { fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.1, color: fill, textShadow: `${d}px ${d}px 0 ${shadow}` };
};

/**
 * Big pixel lettering with a solid one-pixel shadow down and to the right. No outline all
 * round: on the font's narrow counters it would close a 2 into an 8.
 */
export const shadowedText = (size: number, ink: string, fill = "#FFFFFF"): React.CSSProperties => {
  const o = CELL;
  return { fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1, color: fill, textShadow: `${o}px 0 0 ${ink}, 0 ${o}px 0 ${ink}, ${o}px ${o}px 0 ${ink}` };
};

/** A number struck into metal: dark lettering with a lit edge below and to the right. */
export const struckText = (size: number, metal: string): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1,
  color: tone(metal, -0.62),
  textShadow: `${CELL}px ${CELL}px 0 ${tone(metal, 0.5)}`,
});

/** A rasterised sprite. */
export const Sprite: React.FC<{ raster: Raster; style?: React.CSSProperties }> = ({ raster, style }) => (
  <svg
    width={raster.width}
    height={raster.height}
    viewBox={`0 0 ${raster.width} ${raster.height}`}
    shapeRendering="crispEdges"
    style={{ position: "absolute", left: raster.x, top: raster.y, overflow: "visible", ...style }}
  >
    {raster.paths.map((p) => (
      <path key={p.colour} d={p.d} fill={p.colour} />
    ))}
  </svg>
);

/**
 * A hand-placed sprite: one string per row, one character per cell, coloured by `colours`
 * ("." is see-through). Its top left sits at x, y.
 */
export const Bitmap: React.FC<{ rows: string[]; colours: Record<string, string>; x: number; y: number; cell?: number; style?: React.CSSProperties }> = ({ rows, colours, x, y, cell = CELL, style }) => {
  const key = Object.entries(colours).join(";");
  const paths = useMemo(() => {
    const runs = new Map<string, string>();
    rows.forEach((row, j) => {
      let i = 0;
      while (i < row.length) {
        const ch = row[i]!;
        let end = i + 1;
        while (end < row.length && row[end] === ch) end++;
        const fill = colours[ch];
        if (ch !== "." && fill) runs.set(fill, `${runs.get(fill) ?? ""}M${i * cell} ${j * cell}h${(end - i) * cell}v${cell}h${-(end - i) * cell}z`);
        i = end;
      }
    });
    return [...runs];
  }, [rows, key, cell]);
  const w = Math.max(...rows.map((r) => r.length)) * cell;
  return (
    <svg width={w} height={rows.length * cell} shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y, overflow: "visible", ...style }}>
      {paths.map(([fill, d]) => (
        <path key={fill} d={d} fill={fill} />
      ))}
    </svg>
  );
};

/** A twinkle in three poses: a dot, a cross, a star. */
const TWINKLE = [
  [".....", ".....", "..o..", ".....", "....."],
  [".....", "..o..", ".ooo.", "..o..", "....."],
  ["..o..", "..o..", "oowoo", "..o..", "..o.."],
];

/** A pixel sparkle cycling through its poses, `phase` frames out of step with the others. */
export const Twinkle: React.FC<{ x: number; y: number; colour: string; phase?: number; cell?: number }> = ({ x, y, colour: c, phase = 0, cell = CELL }) => {
  const frame = useCurrentFrame();
  const k = Math.floor((frame + phase) / (STEP * 2)) % 4;
  const pose = TWINKLE[[0, 1, 2, 1][k]!]!;
  return <Bitmap rows={pose} colours={{ o: c, w: "#FFFFFF" }} x={snap(x) - 2 * cell} y={snap(y) - 2 * cell} cell={cell} />;
};
