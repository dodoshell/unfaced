import { describe, expect, it } from "vitest";
import type { SlideBox } from "../../engine/remotion/styles/registry.js";
import { checkPost } from "../../engine/src/check/post.js";
import type { PostPlan } from "../../engine/src/post/buildPostPlan.js";
import { formatFor } from "../../engine/src/post/formats.js";
import type { FormatName, Slide } from "../../engine/src/post/types.js";

function box(over: Partial<SlideBox>): SlideBox {
  return { id: "headline", role: "display", text: "Hi", x: 100, y: 300, w: 400, h: 200, maxSize: 80, minSize: 40, lineHeight: 1.1, color: "#FFFFFF", on: "#101418", readable: "body", ...over };
}

function slide(index: number): Slide {
  return { index, kind: index === 0 ? "cover" : "point", attrs: {}, body: [], items: [], line: 5 + index * 4 };
}

function plan(slides: SlideBox[][], format: FormatName = "instagram-carousel"): PostPlan {
  return {
    style: 99,
    format: formatFor(format),
    language: "en",
    palette: ["#101418", "#4F8CFF", "#7FB0FF", "#2F9E6A", "#F2F2F2"],
    brand: {},
    fonts: { display: "a.ttf", accent: "a.ttf", text: "a.ttf", mono: "a.ttf" },
    slides: slides.map((boxes, i) => ({ slide: slide(i), boxes, fitted: {} })),
  };
}

describe("checkPost", () => {
  it("passes boxes that are inside the safe area, apart and readable", () => {
    expect(checkPost(plan([[box({})], [box({ id: "body", y: 600 })]]))).toEqual([]);
  });

  it("flags a box below the safe area of a 4:5 slide", () => {
    const issues = checkPost(plan([[box({})], [box({ id: "body", y: 1300, h: 40 })]]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ check: "post-safe-area", atMs: 0, severity: "error" });
    expect(issues[0]!.message).toContain("slide 2");
    expect(issues[0]!.message).toContain('"body"');
  });

  it("flags a story box in the top 250 px", () => {
    const issues = checkPost(plan([[box({ y: 400 })], [box({ y: 200, h: 40 })]], "story"));
    expect(issues.map((i) => i.check)).toEqual(["post-safe-area"]);
  });

  it("flags two boxes of one slide that overlap", () => {
    const issues = checkPost(plan([[box({})], [box({ id: "a" }), box({ id: "b", x: 300, y: 400 })]]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ check: "post-overlap", severity: "error" });
    expect(issues[0]!.message).toContain("slide 2");
  });

  it("does not compare boxes of different slides", () => {
    expect(checkPost(plan([[box({})], [box({})]]))).toEqual([]);
  });

  it("flags text whose colour does not read on what is under it", () => {
    const issues = checkPost(plan([[box({})], [box({ id: "body", color: "#777777", on: "#888888" })]]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ check: "contrast", severity: "error" });
    expect(issues[0]!.message).toContain("#777777");
  });

  it("holds large text to 3:1 and body text to 4.5:1", () => {
    const grey = { color: "#767676", on: "#FFFFFF" }; // about 4.54:1
    const light = { color: "#949494", on: "#FFFFFF" }; // about 3.03:1
    expect(checkPost(plan([[box({})], [box({ ...grey })]]))).toEqual([]);
    expect(checkPost(plan([[box({})], [box({ ...light, readable: "large" })]]))).toEqual([]);
    expect(checkPost(plan([[box({})], [box({ ...light })]])).map((i) => i.check)).toEqual(["contrast"]);
  });

  it("flags a cover headline outside the 4:5 grid crop", () => {
    const issues = checkPost(plan([[box({ y: 100, h: 200 })], [box({})]]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ check: "cover-crop", severity: "error" });
    expect(issues[0]!.message).toContain("slide 1");
  });

  it("leaves the crop to 4:5 formats and to the cover's headline", () => {
    expect(checkPost(plan([[box({ y: 300 })], [box({ y: 100, h: 100 })]]))).toEqual([]);
    expect(checkPost(plan([[box({ id: "label", y: 60, h: 40 }), box({ y: 300 })], [box({})]]))).toEqual([]);
    expect(checkPost(plan([[box({ y: 300 })], [box({})]], "story"))).toEqual([]);
  });
});
