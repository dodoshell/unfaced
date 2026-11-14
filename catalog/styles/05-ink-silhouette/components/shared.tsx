import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont, type Scene, useVideo } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../fonts/Cinzel.ttf";
import { CINZEL, colour } from "./layout.js";

export const FONT = "Cinzel";
loadFont(FONT, fontUrl, { weight: "400 900" });

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (hex: string): [number, number, number] => {
  if (!HEX.test(hex)) return [128, 128, 128];
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `a` mixed `t` of the way towards `b`. */
export function mix(a: string, b: string, t: number): string {
  const [p, q] = [rgb(a), rgb(b)];
  return `#${p.map((c, i) => Math.round(c + (q[i]! - c) * t).toString(16).padStart(2, "0")).join("")}`;
}

export const alpha = (hex: string, a: number): string => `rgba(${rgb(hex).join(", ")}, ${a})`;

/** Perceived brightness, 0 (black) to 1 (white). */
export const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** The sky and everything lit against it, from the page palette. */
export interface Sky {
  /** Band colours from the top of the frame down to the horizon (y 1420), as [y, colour] stops. */
  stops: Array<[number, string]>;
  glow: string;
  /** The silhouettes: always dark, so the ground under the captions stays dark. */
  ink: string;
  /** Ornaments, list numbers. */
  gold: string;
  /** Discs behind silhouettes. */
  sun: string;
  moon: string;
  /** Distant ridges, between the sky and the ink. */
  far: string;
  near: string;
  text: string;
  /** A soft halo behind white type, the colour of the night sky. */
  halo: string;
}

export function sky(palette: string[]): Sky {
  const low = colour(palette, 1);
  const high = colour(palette, 2);
  const light = colour(palette, 3);
  // A palette made for dark backgrounds has a light ink: its darkest colour makes the silhouettes
  // instead, and the highlight lights the horizon if the background is too dark to glow.
  const roles = [0, 1, 2, 3, 4].map((r) => colour(palette, r as 0 | 1 | 2 | 3 | 4));
  const darkest = roles.reduce((a, b) => (luminance(b) < luminance(a) ? b : a));
  const ink = luminance(colour(palette, 4)) < 0.35 ? colour(palette, 4) : mix(darkest, "#000000", luminance(darkest) < 0.2 ? 0 : 0.6);
  const glow = luminance(colour(palette, 0)) - luminance(ink) > 0.35 ? colour(palette, 0) : mix(light, "#FFFFFF", 0.25);
  // The top of the sky is darkened towards night, so white type reads on any palette.
  const night = mix(high, "#000000", 0.62);
  return {
    stops: [
      [0, night],
      [450, mix(high, "#000000", 0.42)],
      [860, mix(high, "#000000", 0.16)],
      [1110, mix(low, "#000000", 0.08)],
      [1290, mix(low, glow, 0.5)],
      [1420, glow],
    ],
    glow,
    ink,
    gold: light,
    sun: mix(light, "#FFFFFF", 0.5),
    moon: mix(light, "#FFFFFF", 0.7),
    far: mix(mix(low, glow, 0.35), ink, 0.42),
    near: mix(low, ink, 0.68),
    text: "#FFF6E6",
    halo: alpha(night, 0.85),
  };
}

/** The sky's colour at height `y`, between its stops. */
export function skyAt(s: Sky, y: number): string {
  const stops = s.stops;
  if (y <= stops[0]![0]) return stops[0]![1];
  for (let i = 1; i < stops.length; i++) {
    const [y1, c1] = stops[i]!;
    const [y0, c0] = stops[i - 1]!;
    if (y <= y1) return mix(c0, c1, (y - y0) / (y1 - y0));
  }
  return stops.at(-1)![1];
}

/** White serif lettering with a soft night-coloured halo, so it reads over every band. */
export const lettering = (s: Sky, size: number, weight = 700): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: weight,
  fontSize: size,
  lineHeight: CINZEL.lineHeight,
  letterSpacing: "0.04em",
  color: s.text,
  textShadow: `0 2px 3px ${alpha("#000000", 0.35)}, 0 0 28px ${s.halo}, 0 0 10px ${s.halo}`,
});

const EASE = Easing.inOut(Easing.cubic);

/** A slow fade from 0 to 1, `delay` frames into the scene, over `duration` frames. */
export function useFadeIn(delay = 0, duration = 20): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
}

/** 1, then a fade to 0 over the scene's last frames: words leave slowly before the cut. */
export function useFadeOut(scene: Scene, frames = 9): number {
  const frame = useCurrentFrame();
  const end = scene.durationInFrames;
  if (end <= frames * 2) return 1;
  return interpolate(frame, [end - frames, end - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
}

/** A slow float in pixels. */
export function useFloat(amplitude = 8, period = 150, phase = 0): number {
  const frame = useCurrentFrame();
  return Math.sin(((frame + phase) / period) * Math.PI * 2) * amplitude;
}

/** Whether the scene before this one shows the moon too, so the moon stays up across the cut instead of fading in again. */
export function useMoonAlreadyUp(scene: Scene): boolean {
  const scenes = useVideo().plan.scenes;
  const i = scenes.findIndex((s) => s.beatId === scene.beatId);
  return i > 0 && (scenes[i - 1]!.kind === "fact" || scenes[i - 1]!.kind === "outro");
}

/** Roman numerals for the fact numbers and list items ("3" → "III"); anything else passes through. */
export function roman(label: string): string {
  let n = /^\d+$/.test(label) ? Number(label) : 0;
  if (n < 1 || n > 3999) return label;
  const table: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [value, digits] of table) {
    while (n >= value) {
      out += digits;
      n -= value;
    }
  }
  return out;
}

/** The hill in front of the sun that every scene stands on: its top edge at screen x. */
export const HILL_X = 540;
export const hillY = (x: number): number => 1166 + 0.00082 * (x - HILL_X) ** 2;

/** Grass blades along the crest: x, height, lean. Fixed, so the hill is the same in every scene. */
const BLADES = Array.from({ length: 64 }, (_, i) => {
  const x = 236 + i * 10.4 + ((i * 37) % 7);
  return { x, h: 6 + ((i * 53) % 13), lean: ((i * 29) % 9) - 4 };
});

/**
 * The foreground: a pure ink hill with a lone acacia, the mascot's stage. It belongs to the
 * scenes rather than the background, so the dog demo's own park is not hidden behind it.
 */
export const Hill: React.FC<{ s: Sky }> = ({ s }) => {
  const frame = useCurrentFrame();
  let d = `M -40 1920 L -40 ${hillY(-40).toFixed(1)}`;
  for (let x = -20; x <= 1120; x += 20) d += ` L ${x} ${hillY(x).toFixed(1)}`;
  d += " L 1120 1920 Z";
  const sway = Math.sin(frame / 38) * 2.2;
  const grass = BLADES.map((b, i) => {
    const y = hillY(b.x) + 2;
    const tip = b.x + b.lean + sway * (0.5 + (i % 3) * 0.25);
    return `M ${(b.x - 3).toFixed(1)} ${y.toFixed(1)} L ${tip.toFixed(1)} ${(y - b.h).toFixed(1)} L ${(b.x + 3).toFixed(1)} ${y.toFixed(1)} Z`;
  }).join(" ");
  const g = hillY(150);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <g fill={s.ink}>
        <path d={d} />
        <path d={grass} />
        <path d={`M 140 ${g + 4} C 147 ${g - 60} 141 ${g - 108} 151 ${g - 150} L 160 ${g - 150} C 154 ${g - 108} 160 ${g - 60} 168 ${g + 4} Z`} />
        <path d={`M 151 ${g - 116} C 132 ${g - 136} 114 ${g - 148} 96 ${g - 160} M 157 ${g - 128} C 176 ${g - 148} 198 ${g - 158} 218 ${g - 166}`} stroke={s.ink} strokeWidth={8} strokeLinecap="round" fill="none" />
        <ellipse cx={98} cy={g - 168} rx={62} ry={15} />
        <ellipse cx={218} cy={g - 173} rx={72} ry={17} />
        <ellipse cx={156} cy={g - 182} rx={88} ry={19} />
        <ellipse cx={176} cy={g - 196} rx={46} ry={12} />
      </g>
    </svg>
  );
};

/** A thin gold rule with a diamond in the middle, drawn outwards from the centre as `t` goes 0 → 1. */
export const Ornament: React.FC<{ width: number; colour: string; t: number }> = ({ width, colour: c, t }) => {
  const half = width / 2;
  const reach = 20 + (half - 26) * t;
  return (
    <svg width={width} height={24} style={{ display: "block", overflow: "visible", opacity: Math.min(1, t * 1.4) }}>
      <line x1={half - reach} y1={12} x2={half - 20} y2={12} stroke={c} strokeWidth={2.5} />
      <line x1={half + 20} y1={12} x2={half + reach} y2={12} stroke={c} strokeWidth={2.5} />
      <circle cx={half - reach - 7} cy={12} r={3} fill={c} />
      <circle cx={half + reach + 7} cy={12} r={3} fill={c} />
      <rect x={half - 7} y={5} width={14} height={14} transform={`rotate(45 ${half} 12)`} fill={c} />
    </svg>
  );
};

/** A pale disc with a stepped halo: the moon of the fact and outro scenes. */
export const Moon: React.FC<{ cx: number; cy: number; r: number; s: Sky; opacity: number }> = ({ cx, cy, r, s, opacity }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity }}>
    <circle cx={cx} cy={cy} r={r + 130} fill={alpha(s.moon, 0.05)} />
    <circle cx={cx} cy={cy} r={r + 75} fill={alpha(s.moon, 0.08)} />
    <circle cx={cx} cy={cy} r={r + 32} fill={alpha(s.moon, 0.14)} />
    <circle cx={cx} cy={cy} r={r} fill={s.moon} />
  </svg>
);

/** A bird in flight, its wings beating with `flap` (-1 down, 1 up), `span` pixels across. */
export const Bird: React.FC<{ x: number; y: number; span: number; flap: number; ink: string; width?: number }> = ({ x, y, span, flap, ink, width = 4 }) => {
  const s = span / 2;
  const lift = s * 0.42 * flap;
  const d = `M ${-s} ${-lift} Q ${-s * 0.45} ${-lift * 0.15 - s * 0.12} 0 ${s * 0.1} Q ${s * 0.45} ${-lift * 0.15 - s * 0.12} ${s} ${-lift}`;
  return <path d={d} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
};
