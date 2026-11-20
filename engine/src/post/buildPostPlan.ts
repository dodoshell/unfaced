import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { FontRole, SlideBox, SlideContext, TextBox } from "../../remotion/styles/registry.js";
import { getSlideLayout, stylesWithSlides } from "../../remotion/styles/slideLayouts.js";
import { slideLogoFile } from "../../remotion/post/slideFonts.js";
import type { Catalog } from "../catalog/catalog.js";
import { brandPath } from "../page/brand.js";
import { ownSlides, readOwnSlideBoxes } from "../render/ownSlides.js";
import type { Brand, Choice, Page } from "../page/types.js";
import { FitError, type FittedText, fitText } from "./fitText.js";
import { formatFor } from "./formats.js";
import { frameWords } from "./frameWords.js";
import { parseSlides } from "./parseSlides.js";
import type { FormatName, PostFormat, Slide } from "./types.js";

/** Everything needed to render one format of a post, with every text already fitted. */
export interface PostPlan {
  style: number;
  format: PostFormat;
  language: string;
  palette: string[];
  brand: Brand;
  label?: string;
  /** Absolute font files: the brand's where it has one for the role, the style's otherwise. */
  fonts: Record<FontRole, string>;
  /**
   * `own` is a custom slide's boxes from custom/boxes.json for this format: checked for safe
   * area and overlap but not fitted, and with no colours, so not checked for contrast.
   */
  slides: { slide: Slide; boxes: SlideBox[]; fitted: Record<string, FittedText>; own?: TextBox[] }[];
}

const DEFAULT_FORMAT: FormatName = "instagram-carousel";
const ROLES: FontRole[] = ["display", "accent", "text", "mono"];

/**
 * The plans for the post in `postDir` (one per format: `opts.format`, else the front matter's,
 * else the page's, else instagram-carousel). Throws before anything renders when the slide
 * count does not suit a format, the style makes no posts, or a text does not fit its box.
 */
export function buildPostPlans(postDir: string, page: Page, catalog: Catalog, opts: { format?: FormatName } = {}): { plans: PostPlan[]; warnings: string[] } {
  const file = parseSlides(readFileSync(join(postDir, "slides.md"), "utf8"));
  const warnings: string[] = [];

  const names = opts.format ? [opts.format] : file.formats.length ? file.formats : (page.formats ?? [DEFAULT_FORMAT]);
  const formats = [...new Set(names)].map((name) => formatFor(name, file.square));
  const total = file.slides.length;
  for (const format of formats) {
    if (total < format.minSlides || total > format.maxSlides) {
      const range = format.minSlides === format.maxSlides ? `${format.minSlides} slide${format.minSlides === 1 ? "" : "s"}` : `${format.minSlides}–${format.maxSlides} slides`;
      throw new Error(`${format.name} takes ${range}; slides.md has ${total}`);
    }
  }

  const style = postStyle(file.style, page.postStyle, catalog);
  const kit = getSlideLayout(style);
  const styleFile = resolve(catalog.root, catalog.get("style", style).path);
  const { defaultPalette } = JSON.parse(readFileSync(styleFile, "utf8")) as { defaultPalette: string[] };
  const palette = defaultPalette.map((colour, i) => page.palette?.[i] ?? colour);
  const brand = page.brand ?? {};
  const fonts = fontFiles(kit.fonts, dirname(styleFile), brand, page.dir);

  const { words, fallback } = frameWords(page.language);
  if (fallback) warnings.push(`The frame's words ("${words.swipe}", "${words.of}") have no "${page.language}" version yet; they are in English`);

  const plans = formats.map((format): PostPlan => ({
    style,
    format,
    language: page.language,
    palette,
    brand,
    ...(file.label !== undefined && { label: file.label }),
    fonts,
    slides: file.slides.map((slide) => {
      const where = `slides.md line ${slide.line} (slide ${slide.index + 1}, ${slide.kind})`;
      const own = slide.kind === "custom" ? ownBoxes(postDir, slide, format.name, where) : undefined;
      const ctx: SlideContext = { slide, total, format, palette, brand, words, ...(file.label !== undefined && { label: file.label }), ...(brand.logo && { logoFile: slideLogoFile(brand.logo) }) };
      const boxes = kit.layout(ctx);
      return { slide, boxes, fitted: fitBoxes(boxes, fonts, where), ...(own && { own }) };
    }),
  }));
  return { plans, warnings };
}

/** A custom slide's boxes for one format; fails naming the file and id when the slide has no id, the post no custom/index.tsx or boxes.json no entry. */
function ownBoxes(postDir: string, slide: Slide, format: FormatName, where: string): TextBox[] {
  const id = slide.attrs.id;
  if (!id) throw new Error(`${where}: a custom slide needs an id naming its code in custom/index.tsx, such as ## custom {id: phone}`);
  if (!ownSlides(postDir)) throw new Error(`${where}: custom slide "${id}" needs ${join(postDir, "custom", "index.tsx")}, which exports it with export default defineSlides({ ${id}: MySlide })`);
  const file = join(postDir, "custom", "boxes.json");
  const boxes = readOwnSlideBoxes(file)[id]?.[format];
  if (!boxes) throw new Error(`${where}: ${file} has no boxes for slide "${id}" in ${format}; add { "${id}": { "${format}": [] } } (an empty list when it draws no text)`);
  return boxes;
}

/** The style for this post: the front matter's, else the page's; a list or auto takes the first that makes posts. */
function postStyle(fromFile: number | undefined, fromPage: Choice | undefined, catalog: Catalog): number {
  const ready = (n: number) => catalog.get("style", n).posts === "ready" && stylesWithSlides().includes(n);
  const choice = fromFile ?? fromPage ?? "auto";
  if (typeof choice === "number") {
    let entry;
    try {
      entry = catalog.get("style", choice);
    } catch (err) {
      throw new Error(fromFile !== undefined ? `slides.md: ${(err as Error).message}` : (err as Error).message);
    }
    if (ready(choice)) return choice;
    const why = entry.posts === "planned" ? "does not make posts yet" : "makes videos only for now";
    throw new Error(`style ${choice} (${entry.name}) ${why}; styles that make posts: ${postStyles(catalog)}`);
  }
  const options = Array.isArray(choice) ? choice : catalog.ids("style");
  const picked = options.find(ready);
  if (picked === undefined) throw new Error(`None of the style options ${options.join(", ")} makes posts; styles that make posts: ${postStyles(catalog)}`);
  return picked;
}

/** The styles that make posts, as "13 Night tech, …": those ready in the catalog, else those with a slide layout, else "none yet". */
function postStyles(catalog: Catalog): string {
  const name = (n: number) => (catalog.ids("style").includes(n) ? `${n} ${catalog.get("style", n).name}` : String(n));
  const withSlides = stylesWithSlides();
  const ready = withSlides.filter((n) => catalog.ids("style").includes(n) && catalog.get("style", n).posts === "ready");
  const list = ready.length ? ready : withSlides;
  return list.map(name).join(", ") || "none yet";
}

/**
 * Absolute font files by role: a brand font (relative to the page folder) replaces the style's
 * file. A brand display font without a brand accent font also draws the accent, so an accent
 * span is not set in the style's family next to the brand's.
 */
function fontFiles(styleFonts: Record<FontRole, string>, styleDir: string, brand: Brand, pageDir: string): Record<FontRole, string> {
  const own = brand.fonts ?? {};
  const fonts = {} as Record<FontRole, string>;
  for (const role of ROLES) {
    const brandRole = own[role] ? role : role === "accent" && own.display ? "display" : undefined;
    fonts[role] = brandRole ? brandPath(pageDir, `brand.fonts.${brandRole}`, own[brandRole]!) : resolve(styleDir, styleFonts[role]);
  }
  return fonts;
}

/** Each box's lines and size, by box id; a text that does not fit fails naming the slide. */
function fitBoxes(boxes: SlideBox[], fonts: Record<FontRole, string>, where: string): Record<string, FittedText> {
  const fitted: Record<string, FittedText> = {};
  for (const box of boxes) {
    if (box.id in fitted) throw new Error(`${where}: the style lays out two boxes called "${box.id}"`);
    try {
      fitted[box.id] = fitText({
        text: box.text,
        font: fonts[box.role],
        ...(box.accent && { accent: box.accent, accentFont: fonts.accent }),
        box: { x: box.x, y: box.y, w: box.w, h: box.h },
        maxSize: box.maxSize,
        minSize: box.minSize,
        lineHeight: box.lineHeight,
        ...(box.maxLines !== undefined && { maxLines: box.maxLines }),
        ...(box.tracking !== undefined && { tracking: box.tracking }),
        ...(box.upper !== undefined && { upper: box.upper }),
      });
    } catch (err) {
      if (err instanceof FitError) throw new FitError(err.kind, err.detail, `${where}: ${err.message}`);
      throw err;
    }
  }
  return fitted;
}
