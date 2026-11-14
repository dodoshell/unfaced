import type React from "react";
import { useId } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont, type Rect } from "../../../../engine/remotion/kit/index.js";
import pressStartUrl from "../fonts/PressStart2P.ttf";
import rubikUrl from "../fonts/Rubik.ttf";
import { brightness, lit, mix, tone } from "./colours.js";
import { colour } from "./layout.js";
import { pts } from "./poly.js";

/** Body text: the headline and list items. */
export const FONT = "Rubik";
loadFont(FONT, rubikUrl, { weight: "300 900" });
loadFont("Press Start 2P", pressStartUrl, { weight: "400" });
/** The arcade face for CSS (quoted: a family name with "2P" in it is not a valid bare CSS name). Numbers and short labels; every glyph is exactly 1 em wide. */
export const ARCADE = "'Press Start 2P', monospace";

/** Darkens a colour until it is dark enough to carry white text. */
const darkEnough = (c: string, limit: number): string => {
  let out = c;
  for (let i = 0; i < 8 && brightness(out) > limit; i++) out = tone(out, -0.14);
  return out;
};

/** The palette's darkest base: the ink, or the background when the ink is the light one. */
const night = (palette: string[]) => (brightness(colour(palette, 0)) < brightness(colour(palette, 4)) ? colour(palette, 0) : colour(palette, 4));

/** A menu window's fill, top to bottom: deep, tinted with the secondary colour, always dark under white text. */
export const panelFill = (palette: string[]): [string, string] => {
  const base = darkEnough(mix(night(palette), colour(palette, 2), 0.55), 0.3);
  return [tone(base, 0.1), darkEnough(mix(night(palette), colour(palette, 2), 0.2), 0.14)];
};

/** A window's fill in the accent colour (list headers). */
export const accentFill = (palette: string[]): [string, string] => {
  const base = darkEnough(colour(palette, 1), 0.52);
  return [tone(base, 0.08), tone(base, -0.38)];
};

/** The outline and shadow colour: the palette's darkest. */
export const shadowInk = (palette: string[]) => darkEnough(night(palette), 0.12);

/** An octagon inside x0,y0–x1,y1 with corners cut by `cut`, clockwise from the top edge. */
const octagon = (x0: number, y0: number, x1: number, y1: number, cut: number): Array<[number, number]> => [
  [x0 + cut, y0],
  [x1 - cut, y0],
  [x1, y0 + cut],
  [x1, y1 - cut],
  [x1 - cut, y1],
  [x0 + cut, y1],
  [x0, y1 - cut],
  [x0, y0 + cut],
];

/** Outward directions of the octagon's edges, in screen space (y down). */
const EDGE_NORMALS: Array<[number, number]> = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
/** The light comes from the top left. */
const LIGHT_2D: [number, number] = [-0.55, -0.84];

export interface WindowProps {
  box: Rect;
  /** The bevel's colour. */
  border: string;
  /** The panel's gradient, top to bottom. */
  fill: [string, string];
  ink: string;
  bevel?: number;
  cut?: number;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * A 90s game menu window: a chunky bevelled frame with cut corners, each of its eight
 * faces flat shaded by how it faces the light, around a deep gradient panel, with an ink
 * outline and a hard drop shadow. Children sit on the panel.
 */
export const Window: React.FC<WindowProps> = ({ box, border, fill, ink, bevel = 16, cut = 22, style, contentStyle, children }) => {
  const id = `lp${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { w, h } = box;
  const outer = octagon(0, 0, w, h, cut);
  const inner = octagon(bevel, bevel, w - bevel, h - bevel, Math.max(4, cut - bevel * 0.414));
  const faces = outer.map((_, k) => {
    const n = EDGE_NORMALS[k]!;
    const lambert = (n[0] * LIGHT_2D[0] + n[1] * LIGHT_2D[1]) / Math.hypot(n[0], n[1]);
    return { points: pts([outer[k]!, outer[(k + 1) % 8]!, inner[(k + 1) % 8]!, inner[k]!]), fill: lit(border, 0.8 + 0.42 * lambert) };
  });
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: w, height: h, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fill[0]} />
            <stop offset="1" stopColor={fill[1]} />
          </linearGradient>
        </defs>
        <polygon points={pts(outer)} transform="translate(12 14)" fill={ink} opacity={0.5} />
        <polygon points={pts(outer)} fill={ink} stroke={ink} strokeWidth={9} strokeLinejoin="miter" />
        {faces.map((f, i) => (
          <polygon key={i} points={f.points} fill={f.fill} stroke={f.fill} strokeWidth={0.8} />
        ))}
        <polygon points={pts(inner)} fill={`url(#${id})`} stroke={tone(border, -0.62)} strokeWidth={4} />
        {/* A glint along the panel's top edge, like a lit plastic menu. */}
        <polyline points={pts(inner.slice(7).concat(inner.slice(0, 3)))} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={3} transform="translate(0 4)" />
      </svg>
      <div style={{ position: "absolute", inset: bevel, display: "flex", alignItems: "center", ...contentStyle }}>{children}</div>
    </div>
  );
};

/** White body text with a hard drop shadow, as on a 90s menu. */
export const menuText = (size: number, shadow: string, weight = 800): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1.12,
  color: "#FFFFFF",
  textShadow: `0 ${Math.max(3, Math.round(size / 16))}px 0 ${shadow}`,
});

/** Arcade lettering, outlined and extruded down to the right like a 3D game logo. */
export const arcadeText = (size: number, ink: string, depth = Math.round(size / 14), fill = "#FFFFFF"): React.CSSProperties => {
  // Small lettering keeps only the extrusion: an outline would fill in its counters.
  const o = size >= 48 ? Math.round(size / 28) : 0;
  const outline = o === 0 ? [] : [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]].map(([x, y]) => `${x}px ${y}px 0 ${ink}`);
  const extrude = Array.from({ length: depth }, (_, i) => `${o + i + 1}px ${o + i + 1}px 0 ${ink}`);
  return { fontFamily: ARCADE, fontSize: size, lineHeight: 1, color: fill, textShadow: [...outline, ...extrude].join(", ") };
};

/** A snappy entrance, 0 → 1 with a little overshoot over about 12 frames, starting `delay` frames into the scene. */
export function usePop(delay = 0): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 210, mass: 0.6 } });
}

/** A menu slide: 0 → 1 over `frames`, decelerating, starting `delay` frames in. */
export function useSlide(delay = 0, frames = 9): number {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
}
