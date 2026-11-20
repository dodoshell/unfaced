import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { defineSlides, postSlide, setPostSlides } from "../../engine/remotion/core/postSlides.js";
import { registerSlideLayout } from "../../engine/remotion/styles/slideLayouts.js";
import { checkPost } from "../../engine/src/check/post.js";
import type { Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { ownSlides, readOwnSlideBoxes } from "../../engine/src/render/ownSlides.js";
import { PLACEHOLDER_SLIDES, placeholderSlides } from "../fixtures/remotion/placeholderSlides.js";
import { catalogWithSlides } from "./catalogWithSlides.js";

const SLIDES = (custom: string) => `---
title: Phone
post_type: 3
---

## cover
# Our *app*

## custom ${custom}
`;

const BOXES = { phone: { "instagram-carousel": [{ id: "caption", x: 100, y: 500, w: 400, h: 100 }] } };

function setup(slides: string, files: Record<string, string> = {}) {
  const pageDir = mkdtempSync(join(tmpdir(), "unfaced own slides "));
  const dir = join(pageDir, "posts", "phone");
  mkdirSync(join(dir, "custom"), { recursive: true });
  writeFileSync(join(dir, "slides.md"), slides);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, "custom", name), text);
  const page: Page = { dir: pageDir, name: "Studio", language: "en", niche: "software", choices: {}, postStyle: PLACEHOLDER_SLIDES, brand: { handle: "@studio" }, providers: { voice: "kokoro", ai_clips: "none", images: "none" } };
  return { dir, page };
}
const INDEX = "export default {};";
const plans = (dir: string, page: Page) => buildPostPlans(dir, page, catalogWithSlides(), {}).plans;

describe("custom slides", () => {
  beforeAll(() => registerSlideLayout(PLACEHOLDER_SLIDES, placeholderSlides));

  it("uses the boxes of custom/boxes.json for the format, unfitted", () => {
    const { dir, page } = setup(SLIDES("{id: phone}"), { "index.tsx": INDEX, "boxes.json": JSON.stringify(BOXES) });
    const slide = plans(dir, page)[0]!.slides[1]!;
    expect(slide.own).toEqual([{ id: "caption", x: 100, y: 500, w: 400, h: 100 }]);
    expect(Object.keys(slide.fitted)).not.toContain("caption");
  });

  it("checks the boxes for safe area and overlap", () => {
    const boxes = { phone: { "instagram-carousel": [{ id: "out", x: 0, y: 500, w: 400, h: 100 }, { id: "a", x: 100, y: 700, w: 400, h: 100 }, { id: "b", x: 200, y: 750, w: 400, h: 100 }] } };
    const { dir, page } = setup(SLIDES("{id: phone}"), { "index.tsx": INDEX, "boxes.json": JSON.stringify(boxes) });
    const messages = checkPost(plans(dir, page)[0]!).map((i) => `${i.check}: ${i.message}`);
    expect(messages.some((m) => m.startsWith("post-safe-area") && m.includes('"out"'))).toBe(true);
    expect(messages.some((m) => m.startsWith("post-overlap") && m.includes('"a" and "b"'))).toBe(true);
  });

  it("fails a custom slide without an id", () => {
    const { dir, page } = setup(SLIDES(""), { "index.tsx": INDEX, "boxes.json": "{}" });
    expect(() => plans(dir, page)).toThrow(/slides\.md line 9.*custom slide needs an id.*\{id: phone\}/s);
  });

  it("fails an id missing from boxes.json for the format, naming the file and id", () => {
    const { dir, page } = setup(SLIDES("{id: phone}"), { "index.tsx": INDEX, "boxes.json": JSON.stringify({ phone: { story: [] } }) });
    expect(() => plans(dir, page)).toThrow(/boxes\.json.*"phone".*instagram-carousel/s);
    const none = setup(SLIDES("{id: phone}"), { "index.tsx": INDEX });
    expect(() => plans(none.dir, none.page)).toThrow(/boxes\.json.*"phone"/s);
  });

  it("fails without custom/index.tsx", () => {
    const { dir, page } = setup(SLIDES("{id: phone}"), { "boxes.json": JSON.stringify(BOXES) });
    expect(() => plans(dir, page)).toThrow(/index\.tsx/);
  });

  it("fails an id missing from index.tsx exports when the slides are registered, before any render", () => {
    const Slide = () => null;
    expect(() => setPostSlides(defineSlides({ other: Slide }), "/x/custom/index.tsx", ["phone"])).toThrow(/\/x\/custom\/index\.tsx.*"phone".*other/s);
    expect(() => setPostSlides(undefined as never, "/x/custom/index.tsx", ["phone"])).toThrow(/export default defineSlides/);
    setPostSlides(defineSlides({ phone: Slide }), "/x/custom/index.tsx", ["phone"]);
    expect(postSlide("phone")).toBe(Slide);
  });

  it("reads boxes.json and rejects a malformed one", () => {
    const { dir } = setup(SLIDES("{id: phone}"), { "boxes.json": JSON.stringify(BOXES) });
    expect(readOwnSlideBoxes(join(dir, "custom", "boxes.json"))).toEqual(BOXES);
    expect(readOwnSlideBoxes(join(dir, "custom", "none.json"))).toEqual({});
    const bad = (text: string) => {
      writeFileSync(join(dir, "custom", "bad.json"), text);
      return () => readOwnSlideBoxes(join(dir, "custom", "bad.json"));
    };
    expect(bad("{")).toThrow(/not valid JSON/);
    expect(bad('{"phone": []}')).toThrow(/by format/);
    expect(bad('{"phone": {"tablet": []}}')).toThrow(/"tablet".*instagram-carousel/s);
    expect(bad('{"phone": {"story": [{"id": "a"}]}}')).toThrow(/each with an id and x, y, w and h/);
  });

  it("finds custom/index.tsx, or none for a post without a custom folder", () => {
    const a = setup(SLIDES("{id: phone}"), { "index.tsx": INDEX });
    expect(ownSlides(a.dir)).toBe(join(a.dir, "custom", "index.tsx"));
    const b = setup(SLIDES("{id: phone}"));
    expect(() => ownSlides(b.dir)).toThrow(/no index\.tsx/);
    expect(ownSlides(mkdtempSync(join(tmpdir(), "unfaced none ")))).toBeUndefined();
  });
});
