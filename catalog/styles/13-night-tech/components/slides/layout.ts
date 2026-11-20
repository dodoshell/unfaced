// Pure slide layout for style 13: where each slide kind puts its text, and the shapes drawn with
// it (icons, pills, the phone). The slide components draw exactly these boxes and shapes, and
// post plans and their checks call this without rendering, so keep React out of this file.
import { mix } from "../../../../../engine/remotion/core/contrast.js";
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { SlideLayout } from "../../../../../engine/remotion/styles/slideLayouts.js";
import type { Item, PostFormat, Slide, SlideKind } from "../../../../../engine/src/post/types.js";
import style from "../../style.json";
import { colours, groundUnder, onFill, readable, SIZE } from "./tokens.js";

/** The kinds Night tech draws: all of them; `custom` gets the frame only, the post's own code draws the rest. */
export const KINDS: SlideKind[] = ["cover", "point", "list", "steps", "compare", "stat", "quote", "image", "cta", "custom"];

/** The rows of the frame and the area between them that the content uses. */
export interface Frame {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Where the content may go, between the frame's rows (and, on a 4:5 first slide, inside the grid's crop). */
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

/** The place of the handle's mark: the accent dot, or the logo at 28 px high and its own width (up to 220 px). */
export function markOf(ctx: SlideContext): Rect {
  const frame = frameOf(ctx.format);
  if (!ctx.logoFile) return { x: frame.left, y: frame.bottom + (SIZE.frameRow - SIZE.dot) / 2, w: SIZE.dot, h: SIZE.dot };
  const w = Math.round(Math.min(SIZE.logoMaxWidth, Math.max(8, SIZE.logo * (ctx.logoAspect ?? 1))));
  return { x: frame.left, y: frame.bottom + (SIZE.frameRow - SIZE.logo) / 2, w, h: SIZE.logo };
}

/** A row of a list: its icon sits on the first line of the item's box. */
export interface ListRow {
  id: string;
  n: number;
  mark?: Item["mark"];
  icon: { x: number; size: number };
  /** The hairline under the row, between rows only. */
  rule?: { x: number; y: number; w: number };
}

/** A step of the flow: a pill as wide as its text (at most `pill.w`), with the text `padX` inside it. */
export interface FlowStep {
  id: string;
  filled: boolean;
  pill: Rect;
  padX: number;
  /** The second line, at a column to the right, joined to the pill by a dashed leader. */
  second?: { id: string };
}

export interface CompareColumn {
  side: "bad" | "good" | "before" | "after";
  /** Each row's rounded rectangle; a marked row's ✗ or ✓ sits `icon.pad` inside its left edge. */
  items: { id: string; rect: Rect }[];
  icon?: { size: number; pad: number };
}

/** A chip around the cover's phone: its text box is inside `rect`; the chip hugs the text on the phone's side. */
export interface CoverChip {
  id: string;
  side: "left" | "right";
  mark?: Item["mark"];
  /** The chip's edge that overlaps the phone, and its height. */
  anchor: number;
  y: number;
  h: number;
}

export type CoverVisual =
  | { type: "chips"; phone: Rect; fade: number; chips: CoverChip[] }
  | { type: "phone"; phone: Rect; fade: number; screen?: string; card?: Rect & { pad: number } }
  | { type: "notification"; card: Rect; icon: Rect };

/** What a slide draws besides its text, by kind. */
export type Drawing =
  | { kind: "none" }
  | { kind: "cover"; visual?: CoverVisual }
  | { kind: "list"; rows: ListRow[] }
  | { kind: "steps"; steps: FlowStep[]; connectorX: number }
  | { kind: "compare"; columns: CompareColumn[]; arrow?: { x: number; y: number; size: number } }
  | { kind: "stat"; bar: Rect }
  | { kind: "quote"; mark: { x: number; size: number; gap: number }; dash?: Rect }
  | { kind: "image"; photo: Rect }
  | { kind: "cta"; pill: { cx: number; y: number; h: number; padX: number; arrow: number } };

export interface Composed {
  boxes: SlideBox[];
  drawing: Drawing;
}

/** The slide's text boxes: the frame's, then the content's. */
export function layout(ctx: SlideContext): SlideBox[] {
  return compose(ctx).boxes;
}

/** The slide's text boxes and the shapes drawn with them. */
export function compose(ctx: SlideContext): Composed {
  const { kind } = ctx.slide;
  if (!KINDS.includes(kind)) throw new Error(`Night tech does not draw "${kind}" slides; it draws ${KINDS.join(", ")}`);
  const content = kind === "custom" ? { boxes: [], drawing: { kind: "none" as const } } : KIND_LAYOUTS[kind](ctx);
  return { boxes: [...frameBoxes(ctx), ...content.boxes], drawing: content.drawing };
}

type KindLayout = (ctx: SlideContext) => Composed;

/** A text box with its colour checked against the glow under it. */
function box(ctx: SlideContext, b: Omit<SlideBox, "on">): SlideBox {
  const on = groundUnder(ctx.palette, ctx.format, b);
  return { ...b, color: readable(on, b.color, b.readable === "large" ? 3 : 4.5), on };
}

/** A text box on a drawn shape: `fill` over the glow at `alpha` (1 for an opaque fill). */
function boxOn(ctx: SlideContext, b: Omit<SlideBox, "on">, fill: string, alpha = 1): SlideBox {
  const on = alpha >= 1 ? fill : mix(groundUnder(ctx.palette, ctx.format, b), fill, alpha);
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

/** The content area of a slide; on a 4:5 cover (or any first slide) it is held inside the grid's crop. */
function area(ctx: SlideContext) {
  const f = frameOf(ctx.format, ctx.slide.kind === "cover" || ctx.slide.index === 0);
  const { top, bottom } = f.content;
  return { f, top, bottom, height: bottom - top, left: f.left, right: f.right, width: f.right - f.left };
}

type Area = ReturnType<typeof area>;

/** The serif headline standing on `seam` (its box is bottom-aligned, so it grows upwards). */
function headline(ctx: SlideContext, a: Area, seam: number, size: { max: number; min: number; lines: number; lineHeight?: number }, over: Partial<SlideBox> = {}): SlideBox[] {
  const { slide } = ctx;
  if (!slide.headline) return [];
  return [
    box(ctx, {
      id: "headline",
      role: "display",
      text: slide.headline.text,
      ...(slide.headline.accent && { accent: slide.headline.accent }),
      x: a.left,
      y: a.top,
      w: a.width,
      h: seam - SIZE.seamGap - a.top,
      maxSize: size.max,
      minSize: size.min,
      lineHeight: size.lineHeight ?? 1.0,
      maxLines: size.lines,
      tracking: -0.01,
      balance: true,
      color: colours(ctx.palette).ink,
      readable: "large",
      ...over,
    }),
  ];
}

const seamAt = (a: Area, t: number) => Math.round(a.top + a.height * t);

/** Headline and subtitle meet at a seam two thirds down: the headline grows upwards from it, the subtitle hangs below. With a visual, the seam rises to two fifths and the visual takes the space under the subtitle. */
function cover(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const visual = slide.attrs.visual;
  const withVisual = visual === "chips" || visual === "phone" || visual === "notification";
  const seam = seamAt(a, withVisual ? 0.36 : 0.66);
  const boxes = headline(ctx, a, seam, withVisual ? { max: 124, min: 60, lines: 3, lineHeight: 0.98 } : { max: 150, min: 64, lines: 4, lineHeight: 0.98 });
  const subtitle = slide.body.join(" ");
  const subY = seam + SIZE.seamGap;
  const subH = withVisual ? 2 * Math.round(38 * 1.42) : Math.min(a.bottom, subY + 200) - subY;
  if (subtitle) {
    boxes.push(box(ctx, { id: "subtitle", role: "text", text: subtitle, x: a.left, y: subY, w: Math.round(a.width * 0.86), h: subH, maxSize: 38, minSize: 26, lineHeight: 1.42, maxLines: withVisual ? 2 : 3, balance: true, color: c.body, readable: "body" }));
  }
  if (!withVisual) return { boxes, drawing: { kind: "cover" } };

  // The visual's zone: from under the subtitle to the bottom of the content area (not the crop: it holds no headline).
  const zoneTop = subY + (subtitle ? subH : 0) + 40;
  const zoneBottom = frameOf(ctx.format).content.bottom;
  const zone = { x: a.left, y: zoneTop, w: a.width, h: zoneBottom - zoneTop };
  if (visual === "notification") return { boxes: [...boxes, ...notificationBoxes(ctx, zone)], drawing: { kind: "cover", visual: notification(zone) } };

  const phone = phoneIn(zone, (a.left + a.right) / 2);
  const fade = zone.h;
  if (visual === "phone") {
    const screen = slide.attrs.screen;
    const screenBoxes: SlideBox[] = [];
    const card = screenCard(phone, zone);
    if (screen) {
      const y = card.y + card.pad;
      screenBoxes.push(
        boxOn(
          ctx,
          { id: "screen", role: "text", text: screen, x: card.x + card.pad, y, w: card.w - 2 * card.pad, h: card.h - 2 * card.pad, maxSize: 32, minSize: 20, lineHeight: 1.3, maxLines: 4, color: c.ink, readable: "body" },
          messageFill(ctx.palette),
        ),
      );
    }
    return { boxes: [...boxes, ...screenBoxes], drawing: { kind: "cover", visual: { type: "phone", phone, fade, ...(screen && { screen: "screen", card }) } } };
  }

  // Chips around the phone, alternating right and left, staggered down the zone.
  const chipH = Math.round(Math.min(64, Math.max(48, zone.h * 0.15)));
  const overlap = Math.round(phone.w * 0.16);
  const slots = [0.08, 0.34, 0.58, 0.84];
  const chips: CoverChip[] = slide.items.slice(0, 4).map((item, i) => {
    const side = i % 2 === 0 ? "right" : "left";
    const y = Math.round(zone.y + (zone.h - chipH) * slots[i]!);
    return { id: `chip-${i + 1}`, side, ...(item.mark && { mark: item.mark }), anchor: side === "right" ? phone.x + phone.w - overlap : phone.x + overlap, y, h: chipH };
  });
  const chipBoxes = chips.map((chip, i) => {
    const text = chipText(chip, a);
    return boxOn(ctx, { id: chip.id, role: "text", text: slide.items[i]!.text, ...text, maxSize: Math.round(chipH * 0.42), minSize: 18, lineHeight: 1.2, maxLines: 1, color: c.ink, readable: "body" }, chipFill(ctx.palette, chip.mark), 1);
  });
  return { boxes: [...boxes, ...chipBoxes], drawing: { kind: "cover", visual: { type: "chips", phone, fade, chips } } };
}

/** A phone standing in `zone`, centred on `cx`, taller than the zone so its foot fades out at the zone's bottom. */
export function phoneIn(zone: Rect, cx: number): Rect {
  const w = Math.round(Math.min(350, Math.max(320, zone.h * 0.66)));
  return { x: Math.round(cx - w / 2), y: zone.y, w, h: Math.round(w * 2.05) };
}

/** The message card on the phone's screen, under the camera island, as tall as the visible part of the phone allows. */
function screenCard(phone: Rect, zone: Rect): Rect & { pad: number } {
  const inset = Math.round(phone.w * 0.09);
  const y = phone.y + Math.round(phone.w * 0.27);
  return { x: phone.x + inset, y, w: phone.w - 2 * inset, h: Math.round(zone.h * 0.88) - (y - phone.y), pad: Math.round(phone.w * 0.07) };
}

/** The message card's face on the screen. */
export const messageFill = (palette: string[]): string => mix(screenFill(palette), colours(palette).accent, 0.16);

/** The phone's screen colour: the ground with a little accent. */
export const screenFill = (palette: string[]): string => {
  const c = colours(palette);
  return mix(c.surface, c.accent, 0.1);
};

/** A chip's face: opaque, so the phone does not show through its text. */
export const chipFill = (palette: string[], mark?: Item["mark"]): string => {
  const c = colours(palette);
  return mix(c.ground, mark === "bad" ? c.bad : mark === "good" ? c.highlight : c.accent, 0.14);
};

/** Chip padding and icon sizes for a chip of height `h`. */
export const chipParts = (h: number) => ({ pad: Math.round(h * 0.34), icon: Math.round(h * 0.42), gap: Math.round(h * 0.2) });

/** The text box of a chip: between the chip's icon and its outer padding, out to the margin on its side. */
function chipText(chip: CoverChip, a: Area): Rect {
  const { pad, icon, gap } = chipParts(chip.h);
  const textH = Math.round(chip.h * 0.62);
  const y = chip.y + Math.round((chip.h - textH) / 2);
  if (chip.side === "right") {
    const x = chip.anchor + pad + icon + gap;
    return { x, y, w: a.right - pad - x, h: textH };
  }
  const x = a.left + pad + icon + gap;
  return { x, y, w: chip.anchor - pad - x, h: textH };
}

/** A notification card centred in `zone`, with a quieter one stacked behind it. */
function notification(zone: Rect): CoverVisual {
  const card = notificationCard(zone);
  const icon = Math.round(card.h * 0.44);
  return { type: "notification", card, icon: { x: card.x + Math.round(card.h * 0.2), y: card.y + Math.round(card.h * 0.2), w: icon, h: icon } };
}

function notificationCard(zone: Rect): Rect {
  const h = Math.round(Math.min(184, Math.max(132, zone.h * 0.44)));
  const w = Math.round(Math.min(zone.w, 860));
  return { x: Math.round(zone.x + (zone.w - w) / 2), y: Math.round(zone.y + (zone.h - h) / 2 + h * 0.08), w, h };
}

function notificationBoxes(ctx: SlideContext, zone: Rect): SlideBox[] {
  const c = colours(ctx.palette);
  const card = notificationCard(zone);
  const pad = Math.round(card.h * 0.2);
  const icon = Math.round(card.h * 0.44);
  const x = card.x + pad + icon + Math.round(pad * 0.9);
  const w = card.x + card.w - pad - x;
  const fill = c.surface;
  const boxes: SlideBox[] = [];
  const { title, text } = ctx.slide.attrs;
  const titleH = Math.round(card.h * 0.26);
  if (title) boxes.push(boxOn(ctx, { id: "notification-title", role: "text", text: title, x, y: card.y + pad - 4, w, h: titleH, maxSize: Math.round(card.h * 0.19), minSize: 20, lineHeight: 1.25, maxLines: 1, color: c.ink, readable: "body" }, fill));
  if (text) {
    const y = card.y + pad - 4 + (title ? titleH : 0);
    boxes.push(boxOn(ctx, { id: "notification-text", role: "text", text, x, y, w, h: card.y + card.h - pad + 4 - y, maxSize: Math.round(card.h * 0.16), minSize: 18, lineHeight: 1.3, maxLines: 2, color: c.body, readable: "body" }, fill));
  }
  return boxes;
}

/** One idea: the headline above a seam just over two fifths down, the body below it. */
function point(ctx: SlideContext): Composed {
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.42);
  const boxes = headline(ctx, a, seam, { max: 120, min: 56, lines: 3 });
  const body = ctx.slide.body.join("\n\n");
  if (body) {
    const y = seam + SIZE.seamGap;
    boxes.push(box(ctx, { id: "body", role: "text", text: body, x: a.left, y, w: Math.round(a.width * 0.9), h: a.bottom - y, maxSize: 40, minSize: 24, lineHeight: 1.5, color: c.body, readable: "body" }));
  }
  return { boxes, drawing: { kind: "none" } };
}

/** Up to five items under a headline, each after a drawn number (or a ✓ or ✗ when the item is marked), hairlines between. */
function list(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.3);
  const boxes = headline(ctx, a, seam, { max: 104, min: 52, lines: 3 });
  const top = seam + SIZE.seamGap + 16;
  const n = slide.items.length;
  const pitch = Math.floor(Math.min(150, (a.bottom - top) / Math.max(n, 1)));
  const icon = Math.round(Math.min(56, pitch * 0.48));
  const textX = a.left + icon + 32;
  const textW = a.right - textX;
  const rows: ListRow[] = [];
  slide.items.forEach((item, i) => {
    const id = `item-${i + 1}`;
    const y = top + i * pitch + 10;
    const room = pitch - 22;
    const mainH = item.second ? Math.round(room * 0.64) : room;
    const size = Math.round(Math.min(40, Math.max(26, pitch * 0.3)));
    boxes.push(box(ctx, { id, role: "text", text: item.text, x: textX, y, w: textW, h: mainH, maxSize: size, minSize: 22, lineHeight: 1.25, maxLines: 2, balance: true, color: c.ink, readable: "body" }));
    if (item.second) {
      boxes.push(box(ctx, { id: `${id}-second`, role: "text", text: item.second, x: textX, y: y + mainH, w: textW, h: room - mainH, maxSize: Math.round(size * 0.72), minSize: 18, lineHeight: 1.25, maxLines: 1, color: c.muted, readable: "body" }));
    }
    rows.push({ id, n: i + 1, ...(item.mark && { mark: item.mark }), icon: { x: a.left, size: icon }, ...(i < n - 1 && { rule: { x: textX, y: top + (i + 1) * pitch, w: textW } }) });
  });
  return { boxes, drawing: { kind: "list", rows } };
}

/**
 * The steps as a vertical flow of pills joined by arrows. When the steps carry second lines, the
 * steps of one of them are filled with the accent: the line named by `{filled: …}`, else the
 * commonest (on a tie, the one that first appears later), as "software" in "Topic | us,
 * Text | software, Voice | software, Check | us". Without second lines every pill is filled.
 */
function steps(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.3);
  const boxes = headline(ctx, a, seam, { max: 104, min: 52, lines: 3 });
  const top = seam + SIZE.seamGap + 16;
  const n = slide.items.length;
  const pitch = Math.floor(Math.min(136, (a.bottom - top) / Math.max(n, 1)));
  const pillH = Math.round(Math.min(88, pitch * 0.64));
  const padX = Math.round(pillH * 0.48);
  const pillW = Math.round(a.width * 0.56);
  const filledLine = filledSecond(slide);
  const secondX = a.left + pillW + 56;
  const flow: FlowStep[] = [];
  slide.items.forEach((item, i) => {
    const id = `step-${i + 1}`;
    const filled = filledLine === undefined || item.second === filledLine;
    const pill = { x: a.left, y: top + i * pitch, w: pillW, h: pillH };
    const textH = Math.round(pillH * 0.62);
    const textBox = { id, role: "text" as const, text: item.text, x: pill.x + padX, y: pill.y + Math.round((pillH - textH) / 2), w: pillW - 2 * padX, h: textH, maxSize: Math.max(24, Math.round(pillH * 0.4)), minSize: 24, lineHeight: 1.15, maxLines: 1, readable: "large" as const };
    const fill = filled ? c.accent : c.ground;
    boxes.push(filled ? boxOn(ctx, { ...textBox, color: onFill(c.accent, c.ground, 3) }, fill) : box(ctx, { ...textBox, color: c.ink }));
    if (item.second) {
      const h = SIZE.frameRow;
      boxes.push(box(ctx, { id: `${id}-second`, ...mono, upper: true, text: item.second, x: secondX, y: pill.y + Math.round((pillH - h) / 2), w: a.right - secondX, h, color: filled ? c.secondary : c.muted }));
    }
    flow.push({ id, filled, pill, padX, ...(item.second && { second: { id: `${id}-second` } }) });
  });
  return { boxes, drawing: { kind: "steps", steps: flow, connectorX: a.left + Math.round(pillH / 2) } };
}

function filledSecond(slide: Slide): string | undefined {
  const seconds = slide.items.map((i) => i.second).filter((s): s is string => !!s);
  if (!seconds.length) return undefined;
  if (slide.attrs.filled) return slide.attrs.filled;
  const counts = new Map<string, number>();
  for (const s of seconds) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best: string | undefined;
  for (const [s, count] of counts) if (best === undefined || count >= counts.get(best)!) best = s;
  return best;
}

/** ✗ against ✓ (or the first half against the second when nothing is marked), in two columns of rounded rows. */
function compare(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.27);
  const boxes = headline(ctx, a, seam, { max: 96, min: 48, lines: 3 });
  let y = seam + SIZE.seamGap;
  const body = slide.body.join(" ");
  if (body) {
    const h = 2 * Math.round(32 * 1.4);
    boxes.push(box(ctx, { id: "body", role: "text", text: body, x: a.left, y, w: a.width, h, maxSize: 32, minSize: 22, lineHeight: 1.4, maxLines: 2, color: c.body, readable: "body" }));
    y += h;
  }
  y += 40;
  const marked = slide.items.some((i) => i.mark);
  const half = Math.ceil(slide.items.length / 2);
  const groups: { side: CompareColumn["side"]; items: Item[] }[] = marked
    ? [
        { side: "bad", items: slide.items.filter((i) => i.mark === "bad") },
        { side: "good", items: slide.items.filter((i) => i.mark !== "bad") },
      ]
    : [
        { side: "before", items: slide.items.slice(0, half) },
        { side: "after", items: slide.items.slice(half) },
      ];
  const gutter = 28;
  const colW = Math.floor((a.width - gutter) / 2);
  const itemsTop = y;
  const rows = Math.max(1, ...groups.map((g) => g.items.length));
  const pitch = Math.floor(Math.min(136, (a.bottom - itemsTop) / rows));
  const rowH = pitch - 16;
  const pad = Math.round(Math.min(26, rowH * 0.24));
  const icon = marked ? { size: Math.round(Math.min(26, rowH * 0.3)), pad } : undefined;
  const columns: CompareColumn[] = groups.map((group, g) => {
    const x = a.left + g * (colW + gutter);
    const textX = x + pad + (icon ? icon.size + Math.round(pad * 0.6) : 0);
    const items = group.items.map((item, i) => {
      const id = `${group.side}-${i + 1}`;
      const rect = { x, y: itemsTop + i * pitch, w: colW, h: rowH };
      const inset = Math.round(rowH * 0.12);
      boxes.push(
        boxOn(
          ctx,
          { id, role: "text", text: item.text, x: textX, y: rect.y + inset, w: x + colW - pad - textX, h: rowH - 2 * inset, maxSize: Math.round(Math.min(32, rowH * 0.3)), minSize: 18, lineHeight: 1.22, maxLines: 3, balance: true, color: group.side === "bad" || group.side === "before" ? c.body : c.ink, readable: "body" },
          compareFill(ctx.palette, group.side),
        ),
      );
      return { id, rect };
    });
    return { side: group.side, items, ...(icon && { icon }) };
  });
  const arrow = marked ? undefined : { x: a.left + colW + Math.round((gutter - 24) / 2), y: itemsTop + Math.round((rowH - 24) / 2), size: 24 };
  return { boxes, drawing: { kind: "compare", columns, ...(arrow && { arrow }) } };
}

/** A compare row's face: the ground with a little of its side's colour, opaque. */
export const compareFill = (palette: string[], side: CompareColumn["side"]): string => {
  const c = colours(palette);
  const tint = side === "bad" ? c.bad : side === "good" ? c.highlight : side === "after" ? c.accent : c.ink;
  return mix(c.ground, tint, side === "before" ? 0.05 : 0.1);
};

/** A big figure standing on a seam a little past halfway, an accent bar and one line under it. */
function stat(ctx: SlideContext): Composed {
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.56);
  const boxes = headline(ctx, a, seam, { max: 300, min: 100, lines: 1, lineHeight: 1.0 }, { tracking: -0.02, balance: false });
  const bar = { x: a.left, y: seam + 8, w: 72, h: 4 };
  const line = ctx.slide.body.join(" ");
  if (line) {
    const y = seam + 44;
    boxes.push(box(ctx, { id: "body", role: "text", text: line, x: a.left, y, w: Math.round(a.width * 0.82), h: Math.min(a.bottom - y, 3 * Math.round(44 * 1.4)), maxSize: 44, minSize: 26, lineHeight: 1.4, maxLines: 3, balance: true, color: c.body, readable: "body" }));
  }
  return { boxes, drawing: { kind: "stat", bar } };
}

/** The quote standing on a seam low on the slide, a drawn quote mark riding above its first line, the author under the seam. */
function quote(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.7);
  const mark = { x: a.left, size: Math.round(Math.min(72, a.height * 0.08)), gap: 28 };
  const quoted = unquote(slide.headline!);
  const boxes = headline({ ...ctx, slide: { ...slide, headline: quoted } }, { ...a, top: a.top + mark.size + mark.gap }, seam, { max: 80, min: 34, lines: 10, lineHeight: 1.12 }, { tracking: -0.005 });
  const author = slide.body.join(" ");
  let dash: Rect | undefined;
  if (author) {
    const y = seam + SIZE.seamGap;
    const size = 32;
    dash = { x: a.left, y: y + Math.round((size * 1.3) / 2) - 1, w: 40, h: 2 };
    const x = a.left + 64;
    boxes.push(box(ctx, { id: "author", role: "text", text: author, x, y, w: a.right - x, h: Math.min(a.bottom - y, 2 * Math.round(size * 1.3)), maxSize: size, minSize: 22, lineHeight: 1.3, maxLines: 2, color: c.body, readable: "body" }));
  }
  return { boxes, drawing: { kind: "quote", mark, ...(dash && { dash }) } };
}

/** The headline without the quotation marks around it (the slide draws its own), its accent moved to match. */
function unquote(h: NonNullable<Slide["headline"]>): NonNullable<Slide["headline"]> {
  const m = /^\s*["“”«]([\s\S]*?)["”“»]\s*$/.exec(h.text);
  if (!m) return h;
  const start = h.text.indexOf(m[1]!);
  const text = m[1]!;
  if (!h.accent) return { text };
  const s = Math.max(0, h.accent.start - start);
  const e = Math.min(text.length, h.accent.end - start);
  return s < e ? { text, accent: { start: s, end: e } } : { text };
}

/** The photo across the top in a rounded frame, the headline standing under it and the caption below. */
function image(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const headH = slide.headline ? 2 * Math.round(76 * 1.02) : 0;
  const capH = slide.body.length ? 3 * Math.round(32 * 1.4) : 0;
  const photoH = Math.max(Math.round(a.height * 0.4), a.height - headH - capH - 44 - (headH && capH ? SIZE.seamGap : 0));
  const photo = { x: a.left, y: a.top, w: a.width, h: photoH };
  const seam = photo.y + photo.h + 44 + headH;
  const boxes = headline(ctx, { ...a, top: photo.y + photo.h + 44 }, seam + SIZE.seamGap, { max: 76, min: 40, lines: 2, lineHeight: 1.02 });
  const caption = slide.body.join(" ");
  if (caption) {
    const y = seam + (headH ? SIZE.seamGap : 0);
    boxes.push(box(ctx, { id: "body", role: "text", text: caption, x: a.left, y, w: Math.round(a.width * 0.9), h: a.bottom - y, maxSize: 32, minSize: 22, lineHeight: 1.4, maxLines: 3, balance: true, color: c.body, readable: "body" }));
  }
  return { boxes, drawing: { kind: "image", photo } };
}

/** The space between the button's text and its arrow. */
export const CTA_GAP = 20;

/** The closing invite, centred: the headline on a seam just past halfway, the button under it, a small line under that. */
function cta(ctx: SlideContext): Composed {
  const { slide } = ctx;
  const c = colours(ctx.palette);
  const a = area(ctx);
  const seam = seamAt(a, 0.54);
  const boxes = headline(ctx, a, seam, { max: 120, min: 56, lines: 3 });
  const cx = Math.round((a.left + a.right) / 2);
  const pillH = Math.round(Math.min(104, a.height * 0.11));
  const padX = Math.round(pillH * 0.5);
  const arrow = Math.round(pillH * 0.3);
  const pillY = seam + 32;
  const textH = Math.round(pillH * 0.56);
  const textW = a.width - 2 * padX - arrow - CTA_GAP;
  // The text box sits half the arrow's room left of centre, so the pill (text, gap, arrow) is centred.
  const shift = Math.round((arrow + CTA_GAP) / 2);
  boxes.push(
    boxOn(
      ctx,
      { id: "button", role: "text", text: slide.button!, x: cx - shift - Math.round(textW / 2), y: pillY + Math.round((pillH - textH) / 2), w: textW, h: textH, maxSize: Math.round(pillH * 0.34), minSize: 24, lineHeight: 1.2, maxLines: 1, color: onFill(c.accent, c.ground, 3), readable: "large" },
      c.accent,
    ),
  );
  const line = slide.body.join(" ");
  if (line) {
    const y = pillY + pillH + 36;
    const w = Math.round(a.width * 0.8);
    boxes.push(box(ctx, { id: "body", role: "text", text: line, x: cx - Math.round(w / 2), y, w, h: Math.min(a.bottom - y, 3 * Math.round(30 * 1.4)), maxSize: 30, minSize: 22, lineHeight: 1.4, maxLines: 3, balance: true, color: c.body, readable: "body" }));
  }
  return { boxes, drawing: { kind: "cta", pill: { cx, y: pillY, h: pillH, padX, arrow } } };
}

const KIND_LAYOUTS: Record<Exclude<SlideKind, "custom">, KindLayout> = { cover, point, list, steps, compare, stat, quote, image, cta };

/** Night tech's slide fonts and layout, for slideLayouts.ts. */
export const nightTechLayout: SlideLayout = { fonts: style.fonts, layout, kinds: KINDS, ground: "dark" };
