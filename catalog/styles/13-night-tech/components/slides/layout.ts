// Pure slide layout for style 13: where each slide kind puts its text. The slide components draw
// exactly these boxes, and post plans and their checks call this without rendering, so keep
// React out of this file.
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { SlideLayout } from "../../../../../engine/remotion/styles/slideLayouts.js";
import type { PostFormat, SlideKind } from "../../../../../engine/src/post/types.js";
import style from "../../style.json";
import { colours, groundUnder, readable, SIZE } from "./tokens.js";

/** The kinds Night tech draws so far; `custom` gets the frame only, the post's own code draws the rest. */
export const KINDS: SlideKind[] = ["cover", "point", "custom"];

/** The rows of the frame and the area between them that the content uses. */
export interface Frame {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Where the content may go, between the frame's rows (and, on a 4:5 cover, inside the grid's crop). */
  content: { top: number; bottom: number };
}

export function frameOf(format: PostFormat, cover = false): Frame {
  const top = format.safe.top + SIZE.frameInset;
  const bottom = format.height - format.safe.bottom - SIZE.frameInset - SIZE.frameRow;
  const left = Math.max(SIZE.side, format.safe.left);
  const right = format.width - Math.max(SIZE.side, format.safe.right);
  let contentTop = top + SIZE.frameRow + SIZE.frameGap;
  let contentBottom = bottom - SIZE.frameGap;
  const crop = cover ? format.coverArea : undefined;
  if (crop) {
    contentTop = Math.max(contentTop, crop.y + 40);
    contentBottom = Math.min(contentBottom, crop.y + crop.h - 40);
  }
  return { top, bottom, left, right, content: { top: contentTop, bottom: contentBottom } };
}

/** The place of the handle's mark (the accent dot, or the logo when the brand has one). */
export function markOf(ctx: SlideContext): Rect {
  const frame = frameOf(ctx.format);
  const size = ctx.logoFile ? SIZE.logo : SIZE.dot;
  return { x: frame.left, y: frame.bottom + (SIZE.frameRow - size) / 2, w: size, h: size };
}

export function layout(ctx: SlideContext): SlideBox[] {
  const { kind } = ctx.slide;
  if (!KINDS.includes(kind)) throw new Error(`Night tech does not draw "${kind}" slides yet; it draws ${KINDS.join(", ")}`);
  const content = kind === "cover" ? cover(ctx) : kind === "point" ? point(ctx) : [];
  return [...frameBoxes(ctx), ...content];
}

/** A text box with its colour checked against the glow under it. */
function box(ctx: SlideContext, b: SlideBox | Omit<SlideBox, "on">): SlideBox {
  const on = groundUnder(ctx.palette, ctx.format, b);
  return { ...b, color: readable(on, b.color, b.readable === "large" ? 3 : 4.5), on };
}

const mono = { role: "mono" as const, maxSize: SIZE.mono, minSize: 16, lineHeight: 1.3, maxLines: 1, tracking: 0.08, readable: "body" as const };

/** Label and counter on top, the handle (after its dot or logo) and "swipe →" below. */
function frameBoxes(ctx: SlideContext): SlideBox[] {
  const { slide, total, label, brand, words } = ctx;
  const c = colours(ctx.palette);
  const f = frameOf(ctx.format);
  const width = f.right - f.left;
  const half = Math.floor(width / 2) - 12;
  const row = SIZE.frameRow;
  const boxes: SlideBox[] = [];
  const counter = total > 1;
  if (label) boxes.push(box(ctx, { id: "label", ...mono, text: label, upper: true, x: f.left, y: f.top, w: counter ? width - 200 - 24 : width, h: row, color: c.muted }));
  if (counter) boxes.push(box(ctx, { id: "counter", ...mono, text: `${slide.index + 1}/${total}`, x: f.right - 200, y: f.top, w: 200, h: row, color: c.muted }));
  if (brand.handle) {
    const mark = markOf(ctx);
    const x = mark.x + mark.w + SIZE.markGap;
    boxes.push(box(ctx, { id: "handle", ...mono, text: brand.handle, x, y: f.bottom, w: f.left + half - x, h: row, color: c.muted }));
  }
  if (total > 1 && slide.index < total - 1) {
    boxes.push(box(ctx, { id: "swipe", ...mono, text: `${words.swipe} →`, x: f.right - half, y: f.bottom, w: half, h: row, color: c.secondary }));
  }
  return boxes;
}

/** Headline and subtitle meet at a seam two thirds down: the headline grows upwards from it, the subtitle hangs below. */
function cover(ctx: SlideContext): SlideBox[] {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const f = frameOf(ctx.format, true);
  const { top, bottom } = f.content;
  const seam = Math.round(top + (bottom - top) * 0.66);
  const width = f.right - f.left;
  const boxes: SlideBox[] = [];
  if (slide.headline) {
    boxes.push(
      box(ctx, {
        id: "headline",
        role: "display",
        text: slide.headline.text,
        ...(slide.headline.accent && { accent: slide.headline.accent }),
        x: f.left,
        y: top,
        w: width,
        h: seam - SIZE.seamGap - top,
        maxSize: 150,
        minSize: 64,
        lineHeight: 0.98,
        maxLines: 4,
        tracking: -0.01,
        balance: true,
        color: c.ink,
        readable: "large",
      }),
    );
  }
  const subtitle = slide.body.join(" ");
  if (subtitle) {
    const y = seam + SIZE.seamGap;
    boxes.push(box(ctx, { id: "subtitle", role: "text", text: subtitle, x: f.left, y, w: Math.round(width * 0.86), h: Math.min(bottom, y + 200) - y, maxSize: 38, minSize: 28, lineHeight: 1.42, maxLines: 3, color: c.body, readable: "body" }));
  }
  return boxes;
}

/** One idea: the headline above a seam just over two fifths down, the body below it. */
function point(ctx: SlideContext): SlideBox[] {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const f = frameOf(ctx.format);
  const { top, bottom } = f.content;
  const seam = Math.round(top + (bottom - top) * 0.42);
  const width = f.right - f.left;
  const boxes: SlideBox[] = [];
  if (slide.headline) {
    boxes.push(
      box(ctx, {
        id: "headline",
        role: "display",
        text: slide.headline.text,
        ...(slide.headline.accent && { accent: slide.headline.accent }),
        x: f.left,
        y: top,
        w: width,
        h: seam - SIZE.seamGap - top,
        maxSize: 120,
        minSize: 56,
        lineHeight: 1.0,
        maxLines: 3,
        tracking: -0.01,
        balance: true,
        color: c.ink,
        readable: "large",
      }),
    );
  }
  const body = slide.body.join("\n\n");
  if (body) {
    const y = seam + SIZE.seamGap;
    boxes.push(box(ctx, { id: "body", role: "text", text: body, x: f.left, y, w: Math.round(width * 0.9), h: bottom - y, maxSize: 40, minSize: 28, lineHeight: 1.5, color: c.body, readable: "body" }));
  }
  return boxes;
}

/** Night tech's slide fonts and layout, for slideLayouts.ts. */
export const nightTechLayout: SlideLayout = { fonts: style.fonts, layout, kinds: KINDS };
