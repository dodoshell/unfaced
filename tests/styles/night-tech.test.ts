import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { layout, nightTechLayout } from "../../catalog/styles/13-night-tech/components/slides/layout.js";
import { colours, groundUnder } from "../../catalog/styles/13-night-tech/components/slides/tokens.js";
import style from "../../catalog/styles/13-night-tech/style.json";
import { contrast, mix } from "../../engine/remotion/core/contrast.js";
import type { Rect } from "../../engine/remotion/core/safeZone.js";
import type { SlideContext } from "../../engine/remotion/styles/registry.js";
import { getSlideLayout } from "../../engine/remotion/styles/slideLayouts.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { checkPost } from "../../engine/src/check/post.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { FORMAT_NAMES, formatFor } from "../../engine/src/post/formats.js";
import { frameWords } from "../../engine/src/post/frameWords.js";
import { sampleSlides } from "../../engine/src/post/samples.js";
import type { PostFormat, Slide, SlideKind } from "../../engine/src/post/types.js";

const palette = style.defaultPalette;
const { words } = frameWords("en");

const SLIDES: Record<"cover" | "point", Omit<Slide, "index" | "line">> = {
  cover: {
    kind: "cover",
    attrs: {},
    headline: { text: "Your website should work for you", accent: { start: 20, end: 32 } },
    body: ["No templates. Here is how we build sites that bring in clients."],
    items: [],
  },
  point: {
    kind: "point",
    attrs: {},
    headline: { text: "Speed is a feature", accent: { start: 9, end: 18 } },
    body: ["Every second a page takes to load costs you visitors. We build light sites that open fast on any phone, so people stay long enough to get in touch with you."],
    items: [],
  },
};

/** Every format, and the square single post. */
const FORMATS: PostFormat[] = [...FORMAT_NAMES.map((name) => formatFor(name)), formatFor("instagram-post", true)];

/** Where a slide sits in its post: first of eight, in the middle, last, or alone. */
const POSITIONS = [
  { name: "first of 8", index: 0, total: 8 },
  { name: "middle", index: 3, total: 8 },
  { name: "last", index: 7, total: 8 },
  { name: "single", index: 0, total: 1 },
];

function ctx(format: PostFormat, kind: "cover" | "point", index: number, total: number, over: Partial<SlideContext> = {}): SlideContext {
  return { slide: { ...SLIDES[kind], index, line: 1 }, total, format, palette, brand: { handle: "@studionord" }, label: "About", words, ...over };
}

const safeArea = (f: PostFormat): Rect => ({ x: f.safe.left, y: f.safe.top, w: f.width - f.safe.left - f.safe.right, h: f.height - f.safe.top - f.safe.bottom });
const inside = (b: Rect, a: Rect) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const fits = (f: PostFormat, p: (typeof POSITIONS)[number]) => p.total >= f.minSlides && p.total <= f.maxSlides;

describe("style 13 Night tech: slide layout", () => {
  it("is registered as a slide layout with its four fonts", () => {
    expect(getSlideLayout(13)).toBe(nightTechLayout);
    expect(Object.keys(nightTechLayout.fonts).sort()).toEqual(["accent", "display", "mono", "text"]);
  });

  describe.each(FORMATS.map((f) => [`${f.name} ${f.width}×${f.height}`, f] as const))("%s", (_, format) => {
    for (const kind of ["cover", "point"] as const) {
      describe.each(POSITIONS.filter((p) => fits(format, p)).map((p) => [p.name, p] as const))(`${kind}, %s`, (_, p) => {
        const boxes = layout(ctx(format, kind, p.index, p.total));

        it("keeps every box inside the safe area, apart from each other, with unique ids", () => {
          expect(new Set(boxes.map((b) => b.id)).size).toBe(boxes.length);
          for (const box of boxes) expect(inside(box, safeArea(format)), `${box.id} ${JSON.stringify(box)}`).toBe(true);
          boxes.forEach((a, i) => {
            for (const b of boxes.slice(i + 1)) expect(overlaps(a, b), `${a.id} and ${b.id}`).toBe(false);
          });
        });

        it("keeps the cover's headline inside the profile grid's crop", () => {
          const headline = boxes.find((b) => b.id === "headline");
          expect(headline).toBeDefined();
          if (kind === "cover" && format.coverArea) expect(inside(headline!, format.coverArea)).toBe(true);
        });

        it("passes contrast on the default palette, measured on the glow under each box", () => {
          for (const box of boxes) {
            expect(box.on, box.id).toBe(groundUnder(palette, format, box));
            expect(contrast(box.color, box.on), `${box.id} ${box.color} on ${box.on}`).toBeGreaterThanOrEqual(box.readable === "large" ? 3 : 4.5);
          }
        });

        it("draws the frame: label and counter on top, handle and swipe below, swipe only when a slide follows", () => {
          const ids = boxes.map((b) => b.id);
          expect(ids).toContain("label");
          expect(ids).toContain("handle");
          expect(ids.includes("counter")).toBe(p.total > 1);
          const swipe = boxes.find((b) => b.id === "swipe");
          if (p.total > 1 && p.index < p.total - 1) expect(swipe?.text).toBe(`${words.swipe} →`);
          else expect(swipe).toBeUndefined();
          if (p.total > 1) expect(boxes.find((b) => b.id === "counter")?.text).toBe(`${p.index + 1}/${p.total}`);
        });
      });
    }
  });

  it("sets the frame's labels in mono, 22 px, letter-spaced 0.08 em, in the muted ink", () => {
    const boxes = layout(ctx(formatFor("instagram-carousel"), "point", 1, 8));
    const muted = mix(palette[4]!, palette[0]!, 0.45);
    for (const id of ["label", "counter", "handle"]) {
      const box = boxes.find((b) => b.id === id)!;
      expect(box).toMatchObject({ role: "mono", maxSize: 22, tracking: 0.08, color: muted });
    }
    expect(boxes.find((b) => b.id === "label")!.upper).toBe(true);
    expect(boxes.find((b) => b.id === "swipe")).toMatchObject({ role: "mono", color: palette[2] });
    expect(colours(palette).muted).toBe(muted);
  });

  it("sets the headline in the display serif with its accent span, and the body in the text face", () => {
    const boxes = layout(ctx(formatFor("instagram-carousel"), "point", 1, 8));
    expect(boxes.find((b) => b.id === "headline")).toMatchObject({ role: "display", accent: { start: 9, end: 18 } });
    expect(boxes.find((b) => b.id === "body")).toMatchObject({ role: "text" });
  });

  it("leaves out the label when the post has none, and moves the handle past the logo", () => {
    const format = formatFor("instagram-carousel");
    const plain = layout(ctx(format, "point", 1, 8, { label: undefined }));
    expect(plain.map((b) => b.id)).not.toContain("label");
    const logo = layout(ctx(format, "point", 1, 8, { brand: { handle: "@studionord", logo: "brand/logo.svg" }, logoFile: "brand/logo.svg" }));
    expect(logo.find((b) => b.id === "handle")!.x).toBeGreaterThan(plain.find((b) => b.id === "handle")!.x);
  });

  it("refuses the kinds it does not draw yet, naming them", () => {
    const format = formatFor("instagram-carousel");
    const list: Slide = { index: 1, line: 9, kind: "list" as SlideKind, attrs: {}, body: [], items: [{ text: "One" }] };
    expect(() => layout({ ...ctx(format, "point", 1, 8), slide: list })).toThrow(/Night tech does not draw "list" slides yet/);
  });
});

describe("style 13 Night tech: the demo's sample post", () => {
  const page = (dir: string): Page => ({ dir, name: "Studio Nord", language: "en", niche: "websites for shops", choices: {}, postStyle: 13, brand: { handle: "@studionord" }, providers: { voice: "kokoro", ai_clips: "none", images: "none" } });

  it("fits and passes every check in all four formats", () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced night tech "));
    const post = join(dir, "posts", "sample");
    mkdirSync(post, { recursive: true });
    for (const format of FORMAT_NAMES) {
      const count = formatFor(format).maxSlides === 1 ? 1 : undefined;
      writeFileSync(join(post, "slides.md"), sampleSlides(13, { kinds: nightTechLayout.kinds!, formats: [format], ...(count && { count }) }));
      const { plans } = buildPostPlans(post, page(dir), Catalog.load(CATALOG_DIR), { allowPlanned: true });
      expect(plans).toHaveLength(1);
      expect(checkPost(plans[0]!), format).toEqual([]);
    }
  });

  it("is refused without the demo's override while the style's posts are planned", () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced night tech "));
    const post = join(dir, "posts", "sample");
    mkdirSync(post, { recursive: true });
    writeFileSync(join(post, "slides.md"), sampleSlides(13, { kinds: nightTechLayout.kinds!, formats: ["instagram-carousel"] }));
    expect(() => buildPostPlans(post, page(dir), Catalog.load(CATALOG_DIR))).toThrow(/style 13 \(Night tech\) does not make posts yet/);
  });
});
