import type { SlideBox, SlideContext, SlideKit } from "../../../engine/remotion/styles/registry.js";

/** The test-only slide style's number, clear of the catalog's real styles. */
export const PLACEHOLDER_SLIDES = 99;

// A test-only slide style: a top bar (label, counter), the headline, the slide's text below it
// and a bottom bar (handle, swipe), all in plain boxes inside the format's safe area. Fonts are
// relative to this folder, which the test catalog gives as the style's folder.
const fonts: SlideKit["fonts"] = {
  display: "../fonts/Condensed-Anton.ttf",
  accent: "../fonts/Wide-Orbitron.ttf",
  text: "../../../catalog/styles/04-line-art/fonts/Inter.ttf",
  mono: "../../../catalog/styles/04-line-art/fonts/Inter.ttf",
};

const BAR = 40;
const GAP = 20;

function layout(ctx: SlideContext): SlideBox[] {
  const { slide, format, palette, brand, words, total, label } = ctx;
  const ink = palette[4] ?? "#FFFFFF";
  const ground = palette[0] ?? "#000000";
  const left = format.safe.left;
  const top = format.safe.top;
  const width = format.width - format.safe.left - format.safe.right;
  const bottom = format.height - format.safe.bottom;
  const half = (width - GAP) / 2;

  const box = (id: string, role: SlideBox["role"], text: string, x: number, y: number, w: number, h: number, size: [number, number]): SlideBox => ({
    id, role, text, x, y, w, h, maxSize: size[0], minSize: size[1], lineHeight: 1.15, color: ink, on: ground, readable: "body",
  });

  const boxes: SlideBox[] = [];
  if (label) boxes.push(box("label", "mono", label, left, top, half, BAR, [24, 16]));
  boxes.push(box("counter", "mono", `${slide.index + 1}/${total}`, left + half + GAP, top, half, BAR, [24, 16]));
  if (brand.handle) boxes.push(box("handle", "mono", brand.handle, left, bottom - BAR, half, BAR, [24, 16]));
  if (total > 1 && slide.index < total - 1) boxes.push(box("swipe", "text", `${words.swipe} →`, left + half + GAP, bottom - BAR, half, BAR, [24, 16]));

  // The cover's headline starts inside the 4:5 grid crop when the format has one.
  const contentTop = Math.max(top + BAR + 2 * GAP, (format.coverArea?.y ?? 0) + GAP);
  const contentBottom = bottom - BAR - 2 * GAP;
  let y = contentTop;
  if (slide.headline) {
    const h = 360;
    boxes.push({ ...box("headline", "display", slide.headline.text, left, y, width, h, [96, 40]), maxLines: 4, ...(slide.headline.accent && { accent: slide.headline.accent }) });
    y += h + GAP;
  }

  const texts: string[] = [];
  if (slide.body.length) texts.push(slide.body.join(" "));
  for (const item of slide.items) texts.push(item.second ? `${item.text} - ${item.second}` : item.text);
  if (slide.button) texts.push(slide.button);
  if (texts.length) {
    const h = (contentBottom - y - GAP * (texts.length - 1)) / texts.length;
    texts.forEach((text, i) => boxes.push(box(`text-${i + 1}`, "text", text, left, y + i * (h + GAP), width, h, [44, 20])));
  }
  return boxes;
}

export const placeholderSlides: Pick<SlideKit, "fonts" | "layout"> = { fonts, layout };
