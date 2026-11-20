import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compose, layout, markOf, nightTechLayout } from "../../catalog/styles/13-night-tech/components/slides/layout.js";
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
import { samplePhoto, sampleSlides, sampleVisuals } from "../../engine/src/post/samples.js";
import { catalogWithNightTech } from "../page/catalogWithNightTech.js";
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

  it("draws every kind", () => {
    expect([...nightTechLayout.kinds!].sort()).toEqual(["compare", "cover", "cta", "custom", "image", "list", "point", "quote", "stat", "steps"]);
  });

  it("lays out only the frame on a custom slide", () => {
    const custom: Slide = { index: 1, line: 9, kind: "custom" as SlideKind, attrs: { id: "phone" }, body: [], items: [] };
    const boxes = layout({ ...ctx(formatFor("instagram-carousel"), "point", 1, 8), slide: custom });
    expect(boxes.map((b) => b.id).sort()).toEqual(["counter", "handle", "label", "swipe"]);
  });

  it("draws a logo 28 px high at its own width, up to 220 px, and moves the handle past it", () => {
    const format = formatFor("instagram-carousel");
    const withLogo = (logoAspect?: number) => ctx(format, "point", 1, 8, { brand: { handle: "@studionord", logo: "brand/logo.svg" }, logoFile: "brand/logo.svg", ...(logoAspect !== undefined && { logoAspect }) });
    const square = markOf(withLogo(1));
    const wide = markOf(withLogo(4));
    const huge = markOf(withLogo(20));
    expect(square).toMatchObject({ w: 28, h: 28 });
    expect(wide).toMatchObject({ w: 112, h: 28 });
    expect(huge).toMatchObject({ w: 220, h: 28 });
    expect(markOf(withLogo())).toMatchObject({ w: 28, h: 28 });
    const handle = (c: SlideContext) => layout(c).find((b) => b.id === "handle")!;
    expect(handle(withLogo(4)).x).toBe(wide.x + 112 + 14);
    expect(handle(withLogo(4)).x).toBeGreaterThan(handle(withLogo(1)).x);
    for (const aspect of [1, 4, 20]) {
      const mark = markOf(withLogo(aspect));
      for (const box of layout(withLogo(aspect))) expect(overlaps(mark, box), `${aspect} ${box.id}`).toBe(false);
    }
  });

  it("fills the steps of the commonest second line, the later one on a tie, or the one named by filled", () => {
    const format = formatFor("instagram-carousel");
    const steps = (items: Slide["items"], attrs: Record<string, string> = {}): boolean[] => {
      const slide: Slide = { index: 1, line: 9, kind: "steps", attrs, headline: { text: "How" }, body: [], items };
      const { drawing } = compose({ ...ctx(format, "point", 1, 8), slide });
      return drawing.kind === "steps" ? drawing.steps.map((s) => s.filled) : [];
    };
    const reference = [{ text: "Topic", second: "us" }, { text: "Text", second: "software" }, { text: "Voice", second: "software" }, { text: "Check", second: "us" }];
    expect(steps(reference)).toEqual([false, true, true, false]);
    expect(steps(reference, { filled: "us" })).toEqual([true, false, false, true]);
    expect(steps([{ text: "Visit", second: "we" }, { text: "Proof", second: "owner" }, { text: "Print", second: "we" }])).toEqual([true, false, true]);
    expect(steps([{ text: "One" }, { text: "Two" }])).toEqual([true, true]);
  });

  it("draws numbers and marks as icons, never as text", () => {
    const format = formatFor("instagram-carousel");
    const slide: Slide = { index: 1, line: 9, kind: "list", attrs: {}, headline: { text: "What we make" }, body: [], items: [{ text: "Posters" }, { text: "Flyers", mark: "good" }] };
    const { boxes, drawing } = compose({ ...ctx(format, "point", 1, 8), slide });
    for (const box of boxes) expect(box.text, box.id).not.toMatch(/[✓✗]|^\d+\.?$/);
    expect(drawing).toMatchObject({ kind: "list", rows: [{ n: 1 }, { n: 2, mark: "good" }] });
  });
});

describe("style 13 Night tech: the demo's sample post", () => {
  const page = (dir: string): Page => ({ dir, name: "Studio Nord", language: "en", niche: "websites for shops", choices: {}, postStyle: 13, brand: { handle: "@studionord" }, providers: { voice: "kokoro", ai_clips: "none", images: "none" } });

  it("fits and passes every check in all four formats, with its cover visuals too", () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced night tech "));
    const post = join(dir, "posts", "sample");
    mkdirSync(join(post, "inbox"), { recursive: true });
    writeFileSync(join(post, "inbox", "photo.png"), samplePhoto());
    for (const format of FORMAT_NAMES) {
      const single = formatFor(format).maxSlides === 1;
      const samples = [sampleSlides(13, { kinds: nightTechLayout.kinds!, formats: [format], ...(single && { count: 1 }) }), ...(single ? [] : [sampleVisuals(13, [format])])];
      for (const slides of samples) {
        writeFileSync(join(post, "slides.md"), slides);
        const { plans } = buildPostPlans(post, page(dir), Catalog.load(CATALOG_DIR));
        expect(plans).toHaveLength(1);
        expect(checkPost(plans[0]!), format).toEqual([]);
      }
    }
  });

  it("is ready for posts in the catalog; a catalog with them planned refuses it without the demo's override", () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced night tech "));
    const post = join(dir, "posts", "sample");
    mkdirSync(post, { recursive: true });
    writeFileSync(join(post, "slides.md"), sampleSlides(13, { kinds: ["cover", "point"], formats: ["instagram-carousel"] }));
    expect(Catalog.load(CATALOG_DIR).get("style", 13)).toMatchObject({ posts: "ready", status: "planned" });
    expect(() => buildPostPlans(post, page(dir), catalogWithNightTech("planned"))).toThrow(/style 13 \(Night tech\) does not make posts yet/);
  });
});
