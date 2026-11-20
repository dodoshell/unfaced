// Night tech's colours, glow and sizes. Pure, so the layout (and through it the checks) and the
// drawing read the same numbers: the contrast check measures text on the glow the ground draws.
import { liftedOn, mix } from "../../../../../engine/remotion/core/contrast.js";
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import type { PostFormat } from "../../../../../engine/src/post/types.js";
import style from "../../style.json";

/** Palette roles by position: 0 ground, 1 accent, 2 secondary, 3 highlight, 4 ink; short page palettes fall back to the defaults. */
const role = (palette: string[], i: number): string => palette[i] ?? style.defaultPalette[i]!;

export interface NightColours {
  ground: string;
  accent: string;
  secondary: string;
  highlight: string;
  ink: string;
  /** The frame's labels: the ink 45% of the way to the ground. */
  muted: string;
  /** Body text: the ink 22% of the way to the ground, a soft grey-blue that still reads at length. */
  body: string;
}

export function colours(palette: string[]): NightColours {
  const ground = role(palette, 0);
  const ink = role(palette, 4);
  return {
    ground,
    accent: role(palette, 1),
    secondary: role(palette, 2),
    highlight: role(palette, 3),
    ink,
    muted: mix(ink, ground, 0.45),
    body: mix(ink, ground, 0.22),
  };
}

/**
 * The soft glow: an ellipse of the accent colour over the ground, centred low on the right,
 * strongest (35%) at its centre and gone at its edge. Centre and radii are fractions of the
 * slide's width and height; `stops` are [distance from the centre, 0 to 1 of the radius, strength].
 */
export const GLOW = {
  cx: 0.8,
  cy: 0.78,
  rx: 0.9,
  ry: 0.58,
  stops: [
    [0, 0.35],
    [0.15, 0.3],
    [0.35, 0.18],
    [0.6, 0.075],
    [0.85, 0.015],
    [1, 0],
  ] as [number, number][],
};

/**
 * The faint dot grid: a round dot every 24 px, in the ink. 1 px at 6% vanished at full size, so
 * the dots are 2 px across at 8%: there when you look, gone when you read.
 */
export const DOTS = { every: 24, size: 2, opacity: 0.08 };

/** The glow's strength (0 to 0.35) at a point of the slide. */
export function glowAt(format: PostFormat, x: number, y: number): number {
  const d = Math.hypot((x - GLOW.cx * format.width) / (GLOW.rx * format.width), (y - GLOW.cy * format.height) / (GLOW.ry * format.height));
  const { stops } = GLOW;
  if (d >= 1) return 0;
  for (let i = 1; i < stops.length; i++) {
    const [d1, s1] = stops[i]!;
    const [d0, s0] = stops[i - 1]!;
    if (d <= d1) return s0 + ((s1 - s0) * (d - d0)) / (d1 - d0);
  }
  return 0;
}

/** The ground's colour under a box where the glow is brightest: what text in that box must read on. */
export function groundUnder(palette: string[], format: PostFormat, box: Rect): string {
  const cx = GLOW.cx * format.width;
  const cy = GLOW.cy * format.height;
  const x = Math.min(Math.max(cx, box.x), box.x + box.w);
  const y = Math.min(Math.max(cy, box.y), box.y + box.h);
  const { ground, accent } = colours(palette);
  return mix(ground, accent, Math.round(glowAt(format, x, y) * 1000) / 1000);
}

/** `colour` as it is when it reads on `on` at `ratio`, else lifted towards white until it does (for brand palettes). */
export const readable = (on: string, colour: string, ratio: number): string => liftedOn(on, colour, ratio);

/** Sizes in px at 1080 wide. */
export const SIZE = {
  /** Left and right margin of everything. */
  side: 72,
  /** The frame's rows sit this far inside the format's safe area. */
  frameInset: 4,
  frameRow: 30,
  mono: 22,
  /** Space between the frame's rows and the content. */
  frameGap: 96,
  /** The dot before the handle, and the logo that replaces it. */
  dot: 10,
  logo: 28,
  markGap: 14,
  /** Space between the headline and the text under it, either side of the seam. */
  seamGap: 24,
};
