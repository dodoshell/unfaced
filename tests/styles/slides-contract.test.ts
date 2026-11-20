// The contract every style that makes posts keeps: each slide kind, with the longest text the
// slides.md limits allow, fits and passes every post check in every format, with the style's
// own palette and fonts and with very different brand palettes and fonts.
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { getSlideLayout, stylesWithSlides } from "../../engine/remotion/styles/slideLayouts.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { checkPost } from "../../engine/src/check/post.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { Brand, Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { FORMAT_NAMES, formatFor } from "../../engine/src/post/formats.js";
import { LIMITS } from "../../engine/src/post/limits.js";
import { parseSlides } from "../../engine/src/post/parseSlides.js";
import type { FormatName, SlideKind } from "../../engine/src/post/types.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "fonts");

/** Each kind's slide with the longest text its limits allow (docs/formats/slides.md, Kinds). */
const LONGEST: Record<Exclude<SlideKind, "custom">, string> = {
  cover: `## cover
# Your new website should bring *clients to your door* every single week
No templates and no guesswork: here is how we build fast, honest sites that bring in clients.`,
  point: `## point
# Speed is the *feature* people notice
Every second a page takes to load costs you visitors. We build light sites that open quickly on any phone and any network, so people stay long enough to read about you, look at your prices, see your opening hours and then get in touch.`,
  list: `## list
# What every *good website* needs
- Clear prices written right where people expect them
- Opening hours that are kept up to date
- Photos of the real shop and its team
- One simple form that never asks too much
- Pages that load quickly on a slow phone`,
  steps: `## steps
# How a *new site* is born
- First phone call | together
- Written project brief | our studio
- First design proposal | our studio
- Your honest feedback | you
- Build and test | our studio
- Launch day party | together`,
  compare: `## compare
# Our way against *the usual* way
You should not have to chase anyone to get your website done.
- ✗ Templates that everyone else also uses
- ✗ Weeks of waiting for a reply
- ✗ Files sent back and forth forever
- ✗ Hidden costs at the very end
- ✓ One design made for your shop
- ✓ A first proposal within two days
- ✓ One person you can always call
- ✓ One clear price agreed up front`,
  stat: `## stat
# +120.000
visitors a year on the sites we built and still look after today`,
  quote: `## quote
# "They rebuilt our website in just two weeks, explained every single step in plain words, and since the launch the phone rings every single morning with new people asking about our prices and opening hours."
Marta Rossi, owner of Casa Aurora bakery`,
  image: `## image {photo: inbox/photo.png}
# The shop that started it all
Our first client, a small bakery on a quiet side street, now gets new customers from search every week.`,
  cta: `## cta
# Want a website that *works for you*?
Tell us about your shop. We reply within one working day, with no forms to fill.
[Message us: the link is in our bio]`,
};

/** The cover's drawn visuals, each with its longest text. */
const VISUAL_COVERS = [
  `## cover {visual: chips}
# Your new website should bring *clients to your door* every single week
No templates and no guesswork, just sites that work.
- ✓ Fast on phones
- ✓ Made for you
- ✗ No ugly templates
- ✓ Clear fair prices`,
  `## cover {visual: phone, screen: "New booking from Anna, Friday morning at ten"}
# Your new website should bring *clients to your door* every single week
No templates and no guesswork, just sites that work.`,
  `## cover {visual: notification, title: "New enquiry from your shop website", text: "Hello, do you also make posters for shop windows? We open in early March."}
# Your new website should bring *clients to your door* every single week
No templates and no guesswork, just sites that work.`,
];

const PALETTES: Record<string, string[] | undefined> = {
  default: undefined,
  "two colours": ["#FFFFFF", "#FF0055"],
  dark: ["#0A0A0F", "#7C5CFF", "#B9A6FF", "#34D399", "#F4F4F5"],
  light: ["#F7F5F0", "#1F4FFF", "#E2554F", "#2F9E6A", "#111111"],
};

/** Brand fonts by role: none, a condensed face, a very wide face (the mono frame keeps the style's). */
const FONTS: Record<string, Brand["fonts"] | undefined> = {
  "style's": undefined,
  condensed: { display: "brand/Condensed-Anton.ttf", text: "brand/Condensed-Anton.ttf" },
  wide: { display: "brand/Wide-Orbitron.ttf", text: "brand/Wide-Orbitron.ttf" },
};

const FORMATS = [...FORMAT_NAMES.map((name) => ({ name, square: false })), { name: "instagram-post" as FormatName, square: true }];

function photo(): Buffer {
  const png = new PNG({ width: 1080, height: 1350 });
  for (let i = 0; i < png.data.length; i += 4) png.data.set([180, 140, 90, 255], i);
  return PNG.sync.write(png);
}

/** A page folder holding the fixture fonts in brand/ and one post with `slides`. */
function post(style: number, formatName: FormatName, square: boolean, slides: string[], palette?: string[], fonts?: Brand["fonts"]) {
  const dir = mkdtempSync(join(tmpdir(), "unfaced contract "));
  mkdirSync(join(dir, "brand"));
  for (const f of ["Condensed-Anton.ttf", "Wide-Orbitron.ttf"]) copyFileSync(join(fixtures, f), join(dir, "brand", f));
  const postDir = join(dir, "posts", "sample");
  mkdirSync(join(postDir, "inbox"), { recursive: true });
  writeFileSync(join(postDir, "inbox", "photo.png"), photo());
  const front = ["---", "title: Contract", "post_type: 3", `format: ${formatName}`, "label: About us", `style: ${style}`, ...(square ? ["square: true"] : []), "---", ""];
  writeFileSync(join(postDir, "slides.md"), `${[...front, slides.join("\n\n")].join("\n")}\n`);
  const page: Page = {
    dir,
    name: "Studio Nord",
    language: "en",
    niche: "websites for shops",
    choices: {},
    postStyle: style,
    ...(palette && { palette }),
    brand: { handle: "@studionord", ...(fonts && { fonts }) },
    providers: { voice: "kokoro", ai_clips: "none", images: "none" },
  };
  return { postDir, page };
}

const catalog = Catalog.load(CATALOG_DIR);

describe("slides contract: the longest texts", () => {
  const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const parse = (text: string) => parseSlides(`---\ntitle: x\npost_type: 1\n---\n\n${text}\n`).slides[0]!;

  it("are exactly at every limit, so the contract tests the limits themselves", () => {
    const [cover, point, list, steps, compare, stat, quote] = (["cover", "point", "list", "steps", "compare", "stat", "quote"] as const).map((k) => parse(LONGEST[k]));
    expect(words(cover!.headline!.text)).toBe(LIMITS.coverWords);
    expect(words(point!.body.join(" "))).toBe(LIMITS.pointWords);
    expect(list!.items).toHaveLength(LIMITS.listItems);
    for (const item of list!.items) expect(words(item.text), item.text).toBe(LIMITS.listWords);
    expect(steps!.items).toHaveLength(LIMITS.steps.max);
    for (const item of steps!.items) expect(words(item.text), item.text).toBe(LIMITS.stepWords);
    for (const mark of ["bad", "good"]) {
      const side = compare!.items.filter((i) => i.mark === mark);
      expect(side).toHaveLength(LIMITS.comparePerSide);
      for (const item of side) expect(words(item.text), item.text).toBe(LIMITS.compareWords);
    }
    expect([...stat!.headline!.text]).toHaveLength(LIMITS.statCharacters);
    expect(words(quote!.headline!.text)).toBe(LIMITS.quoteWords);
    const [chips, phone, notification] = VISUAL_COVERS.map(parse);
    expect(chips!.items).toHaveLength(LIMITS.coverChips);
    for (const item of chips!.items) expect(words(item.text), item.text).toBe(LIMITS.chipWords);
    for (const visual of [chips, phone, notification]) expect(words(visual!.headline!.text)).toBe(LIMITS.coverWords);
    expect(words(phone!.attrs.screen!)).toBe(LIMITS.screenWords);
    expect(words(notification!.attrs.title!)).toBe(LIMITS.notificationTitleWords);
    expect(words(notification!.attrs.text!)).toBe(LIMITS.notificationTextWords);
  });
});

describe.each(stylesWithSlides().map((s) => [s, catalog.get("style", s).name] as const))("slides contract: style %i %s", (style) => {
  const kinds = (getSlideLayout(style).kinds ?? (Object.keys(LONGEST) as SlideKind[])).filter((k): k is keyof typeof LONGEST => k !== "custom");

  it("draws every slide kind, and the cover's visuals", () => {
    expect(kinds.sort()).toEqual(Object.keys(LONGEST).sort());
  });

  it("is ready for posts in the catalog", () => {
    expect(catalog.get("style", style).posts).toBe("ready");
  });

  for (const format of FORMATS) {
    const label = `${format.name}${format.square ? " (square)" : ""}`;
    for (const [paletteName, palette] of Object.entries(PALETTES)) {
      for (const [fontName, fonts] of Object.entries(FONTS)) {
        it(`${label}, ${paletteName} palette, ${fontName} fonts: every kind at its longest fits and passes the checks`, () => {
          const single = formatFor(format.name, format.square).maxSlides === 1;
          // A single post takes one slide, so each kind is its own post; otherwise one post holds them all.
          const all = kinds.map((k) => LONGEST[k]);
          const posts = single ? [...all, ...VISUAL_COVERS].map((s) => [s]) : [all, VISUAL_COVERS];
          for (const slides of posts) {
            const { postDir, page } = post(style, format.name, format.square, slides, palette, fonts);
            const { plans } = buildPostPlans(postDir, page, catalog);
            expect(plans).toHaveLength(1);
            expect(checkPost(plans[0]!)).toEqual([]);
          }
        });
      }
    }
  }

  it("fails a cover headline one word over the limit, naming the slide", () => {
    const over = LONGEST.cover.replace("every single week", "every single working week");
    const { postDir, page } = post(style, "instagram-carousel", false, [LONGEST.point, over]);
    expect(() => buildPostPlans(postDir, page, catalog)).toThrow(/^slides\.md line \d+ \(slide 2, cover\): .*12 words.*13/);
  });
});

describe("slides contract: Night tech's ground", () => {
  it("keeps its dark ground for a light palette, and says so", () => {
    const { postDir, page } = post(13, "instagram-carousel", false, [LONGEST.cover, LONGEST.point], PALETTES.light);
    const { plans, warnings } = buildPostPlans(postDir, page, catalog);
    expect(warnings).toContain("Night tech keeps its dark ground; palette background #F7F5F0 ignored");
    expect(plans[0]!.palette[0]).toBe("#0B1020");
    expect(plans[0]!.palette.slice(1, 4)).toEqual(["#1F4FFF", "#E2554F", "#2F9E6A"]);
  });

  it("takes a dark palette's background, without a warning", () => {
    const { postDir, page } = post(13, "instagram-carousel", false, [LONGEST.cover, LONGEST.point], PALETTES.dark);
    const { plans, warnings } = buildPostPlans(postDir, page, catalog);
    expect(warnings.filter((w) => w.includes("ground"))).toEqual([]);
    expect(plans[0]!.palette).toEqual(PALETTES.dark);
  });

  it("names the white of a two-colour palette, in capitals", () => {
    const { postDir, page } = post(13, "instagram-carousel", false, [LONGEST.cover, LONGEST.point], ["#ffffff", "#FF0055"]);
    const { plans, warnings } = buildPostPlans(postDir, page, catalog);
    expect(warnings).toContain("Night tech keeps its dark ground; palette background #FFFFFF ignored");
    expect(plans[0]!.palette[1]).toBe("#FF0055");
  });
});
