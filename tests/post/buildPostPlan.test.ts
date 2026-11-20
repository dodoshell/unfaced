import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { registerSlideLayout, stylesWithSlides } from "../../engine/remotion/styles/slideLayouts.js";
import type { Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { FitError } from "../../engine/src/post/fitText.js";
import { PLACEHOLDER_SLIDES, placeholderSlides } from "../fixtures/remotion/placeholderSlides.js";
import { catalogWithSlides } from "./catalogWithSlides.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "fixtures");

const EXAMPLE = `---
title: Who we are
post_type: 3
format: [instagram-carousel]
label: ABOUT
---

## cover
# This page is made by *our software*
No filming, no faces. Here is why.

## compare
# Why *no faces*
You have no time to film, and not everyone wants to be on camera.
- ✗ cameras
- ✗ filming
- ✓ graphics
- ✓ voice

## steps
# How *a post* is born
- Topic | us
- Text | software
- Voice | software
- Check | us

## cta
# Want your socials *like this*?
[Join the waiting list: link in bio]
`;

function page(dir: string, over: Partial<Page> = {}): Page {
  return {
    dir,
    name: "Studio Nord",
    language: "en",
    niche: "software for shops",
    choices: {},
    postStyle: PLACEHOLDER_SLIDES,
    brand: { handle: "@studionord" },
    providers: { voice: "kokoro", ai_clips: "none", images: "none" },
    ...over,
  };
}

function postDir(slides: string): { pageDir: string; dir: string } {
  const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
  const dir = join(pageDir, "posts", "about-us");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "slides.md"), slides);
  return { pageDir, dir };
}

const catalog = catalogWithSlides();

beforeAll(() => {
  registerSlideLayout(PLACEHOLDER_SLIDES, placeholderSlides);
});

describe("buildPostPlans", () => {
  it("builds the spec example as one instagram-carousel plan with every box fitted", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    const { plans, warnings } = buildPostPlans(dir, page(pageDir), catalog);
    expect(warnings).toEqual([]);
    expect(plans).toHaveLength(1);
    const plan = plans[0]!;
    expect(plan.style).toBe(PLACEHOLDER_SLIDES);
    expect(plan.format.name).toBe("instagram-carousel");
    expect(plan.format.height).toBe(1350);
    expect(plan.label).toBe("ABOUT");
    expect(plan.language).toBe("en");
    expect(plan.palette).toEqual(["#101418", "#4F8CFF", "#7FB0FF", "#2F9E6A", "#F2F2F2"]);
    expect(plan.slides.map((s) => s.slide.kind)).toEqual(["cover", "compare", "steps", "cta"]);
    for (const { boxes, fitted } of plan.slides) {
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        const fit = fitted[box.id]!;
        expect(fit).toBeDefined();
        expect(fit.lines.map((l) => l.text).join(" ")).toBe(box.text);
        expect(fit.height).toBeLessThanOrEqual(box.h);
      }
    }
    expect(plan.slides[0]!.fitted.headline!.lines.some((l) => l.accent)).toBe(true);
    // No swipe on the last slide.
    expect(plan.slides[3]!.boxes.some((b) => b.id === "swipe")).toBe(false);
    expect(plan.slides[0]!.boxes.find((b) => b.id === "counter")!.text).toBe("1/4");
  });

  it("makes one plan per front matter format, each at its own size", () => {
    const { pageDir, dir } = postDir(EXAMPLE.replace("format: [instagram-carousel]", "format: [instagram-carousel, story]"));
    const { plans } = buildPostPlans(dir, page(pageDir), catalog);
    expect(plans.map((p) => p.format.name)).toEqual(["instagram-carousel", "story"]);
    expect(plans.map((p) => p.format.height)).toEqual([1350, 1920]);
    expect(plans[1]!.slides[0]!.boxes.find((b) => b.id === "headline")!.y).toBeGreaterThanOrEqual(250);
  });

  it("takes the page's formats when the front matter has none, and --format over both", () => {
    const { pageDir, dir } = postDir(EXAMPLE.replace("format: [instagram-carousel]\n", ""));
    expect(buildPostPlans(dir, page(pageDir, { formats: ["linkedin-carousel"] }), catalog).plans.map((p) => p.format.name)).toEqual(["linkedin-carousel"]);
    expect(buildPostPlans(dir, page(pageDir), catalog).plans.map((p) => p.format.name)).toEqual(["instagram-carousel"]);
    expect(buildPostPlans(dir, page(pageDir), catalog, { format: "story" }).plans.map((p) => p.format.name)).toEqual(["story"]);
  });

  it("refuses a slide count outside the format's limits", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `## point\n# Point ${i + 1}\nOne idea.\n`).join("\n");
    const { pageDir, dir } = postDir(`---\ntitle: Many\npost_type: 1\n---\n\n${eleven}`);
    expect(() => buildPostPlans(dir, page(pageDir), catalog)).toThrow("instagram-carousel takes 2–10 slides; slides.md has 11");
  });

  it("names the line and the slide when a headline does not fit", () => {
    const long = Array.from({ length: 80 }, () => "unbelievably").join(" ");
    const { pageDir, dir } = postDir(EXAMPLE.replace("# Why *no faces*", `# ${long}`));
    let error: unknown;
    try {
      buildPostPlans(dir, page(pageDir), catalog);
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(FitError);
    expect((error as Error).message).toMatch(/^slides\.md line 12 \(slide 2, compare\): /);
  });

  it("uses a brand font file in place of the style's for its role", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    mkdirSync(join(pageDir, "brand", "fonts"), { recursive: true });
    copyFileSync(join(fixtures, "fonts", "Wide-Orbitron.ttf"), join(pageDir, "brand", "fonts", "Brand.ttf"));
    const { plans } = buildPostPlans(dir, page(pageDir, { brand: { handle: "@studionord", fonts: { display: "brand/fonts/Brand.ttf" } } }), catalog);
    const fonts = plans[0]!.fonts;
    expect(fonts.display).toBe(resolve(pageDir, "brand", "fonts", "Brand.ttf"));
    expect(fonts.text).toBe(resolve(fixtures, "..", "..", "catalog", "styles", "04-line-art", "fonts", "Inter.ttf"));
    expect(fonts.accent).toBe(resolve(pageDir, "brand", "fonts", "Brand.ttf"));
  });

  it("draws the accent in the brand's accent font when it has one, and in the style's when the brand has no display font", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    mkdirSync(join(pageDir, "brand", "fonts"), { recursive: true });
    copyFileSync(join(fixtures, "fonts", "Wide-Orbitron.ttf"), join(pageDir, "brand", "fonts", "Display.ttf"));
    copyFileSync(join(fixtures, "fonts", "Condensed-Anton.ttf"), join(pageDir, "brand", "fonts", "Accent.ttf"));
    const both = { handle: "@studionord", fonts: { display: "brand/fonts/Display.ttf", accent: "brand/fonts/Accent.ttf" } };
    expect(buildPostPlans(dir, page(pageDir, { brand: both }), catalog).plans[0]!.fonts.accent).toBe(resolve(pageDir, "brand", "fonts", "Accent.ttf"));
    const textOnly = { handle: "@studionord", fonts: { text: "brand/fonts/Accent.ttf" } };
    expect(buildPostPlans(dir, page(pageDir, { brand: textOnly }), catalog).plans[0]!.fonts.accent).toBe(resolve(fixtures, "fonts", "Wide-Orbitron.ttf"));
  });

  it("gives the style's files as absolute paths without a brand font", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    const fonts = buildPostPlans(dir, page(pageDir), catalog).plans[0]!.fonts;
    expect(fonts.display).toBe(resolve(fixtures, "fonts", "Condensed-Anton.ttf"));
    expect(fonts.accent).toBe(resolve(fixtures, "fonts", "Wide-Orbitron.ttf"));
  });

  it("keeps the style's palette roles the page palette leaves out", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    const { plans } = buildPostPlans(dir, page(pageDir, { palette: ["#000000", "#FF0055"] }), catalog);
    expect(plans[0]!.palette).toEqual(["#000000", "#FF0055", "#7FB0FF", "#2F9E6A", "#F2F2F2"]);
  });

  it("refuses a style that has no slides, naming the styles that make posts", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    expect(() => buildPostPlans(dir, page(pageDir, { postStyle: 3 }), catalog)).toThrow(
      "style 3 (Flat cartoon) makes videos only for now; styles that make posts: 13 Night tech, 99 Placeholder slides",
    );
  });

  it("picks the first style that makes posts from a list or auto", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    expect(buildPostPlans(dir, page(pageDir, { postStyle: [3, PLACEHOLDER_SLIDES] }), catalog).plans[0]!.style).toBe(PLACEHOLDER_SLIDES);
    expect(buildPostPlans(dir, page(pageDir, { postStyle: "auto" }), catalog).plans[0]!.style).toBe(13);
    expect(buildPostPlans(dir, page(pageDir, { postStyle: undefined }), catalog).plans[0]!.style).toBe(13);
    expect(() => buildPostPlans(dir, page(pageDir, { postStyle: [3, 4] }), catalog)).toThrow("styles that make posts: 13 Night tech, 99 Placeholder slides");
  });

  it("takes the front matter's style over the page's", () => {
    const { pageDir, dir } = postDir(EXAMPLE.replace("label: ABOUT", "label: ABOUT\nstyle: 3"));
    expect(() => buildPostPlans(dir, page(pageDir), catalog)).toThrow("style 3 (Flat cartoon) makes videos only for now");
  });

  it("does not use a style whose posts are not ready in the catalog", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    expect(() => buildPostPlans(dir, page(pageDir), catalogWithSlides("planned"))).toThrow(/style 99 \(Placeholder slides\) does not make posts yet/);
  });

  it("warns when the frame's words fall back to English", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    const { plans, warnings } = buildPostPlans(dir, page(pageDir, { language: "de" }), catalog);
    expect(plans[0]!.slides[0]!.boxes.find((b) => b.id === "swipe")!.text).toBe("swipe →");
    expect(warnings).toEqual(['The frame\'s words ("swipe", "of") have no "de" version yet; they are in English']);
  });

  it("takes an image slide's photo from inside the post folder, and stops before rendering when it is missing or outside", () => {
    const image = (photo: string) => EXAMPLE.replace("## cta", `## image {photo: ${photo}}\n# Our shop\n\n## cta`);
    const { pageDir, dir } = postDir(image("inbox/shop.png"));
    expect(() => buildPostPlans(dir, page(pageDir), catalog)).toThrow(/^slides\.md line \d+ \(slide 4, image\): the photo inbox\/shop\.png is missing \(looked for .*shop\.png\)/);
    mkdirSync(join(dir, "inbox"));
    writeFileSync(join(dir, "inbox", "shop.png"), "png");
    const { plans } = buildPostPlans(dir, page(pageDir), catalog);
    expect(plans[0]!.slides[3]!.photo).toBe(join(dir, "inbox", "shop.png"));
    expect(plans[0]!.slides[0]!.photo).toBeUndefined();
    writeFileSync(join(dir, "slides.md"), image("../../outside.png"));
    expect(() => buildPostPlans(dir, page(pageDir), catalog)).toThrow(/slide 4, image\): the photo \.\.\/\.\.\/outside\.png must be inside the post folder/);
    writeFileSync(join(dir, "slides.md"), image("inbox/shop.gif"));
    expect(() => buildPostPlans(dir, page(pageDir), catalog)).toThrow(/is not a PNG, JPEG or WebP image/);
  });

  it("reads the logo's width over its height into the plan", () => {
    const { pageDir, dir } = postDir(EXAMPLE);
    mkdirSync(join(pageDir, "brand"));
    writeFileSync(join(pageDir, "brand", "logo.svg"), '<svg viewBox="0 0 240 60"></svg>');
    const { plans } = buildPostPlans(dir, page(pageDir, { brand: { handle: "@studionord", logo: "brand/logo.svg" } }), catalog);
    expect(plans[0]!.logoAspect).toBe(4);
    expect(buildPostPlans(dir, page(pageDir), catalog).plans[0]!.logoAspect).toBeUndefined();
  });

  it("lists the registered slide styles", () => {
    expect(stylesWithSlides()).toContain(PLACEHOLDER_SLIDES);
  });
});
