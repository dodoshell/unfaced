import { describe, expect, it } from "vitest";
import { SlidesError, parseSlides } from "../../engine/src/post/parseSlides.js";

const SPEC = `---
title: Who we are
post_type: 3
format: [instagram-carousel]      # optional; page's formats otherwise
label: ABOUT                      # optional small label on every slide
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

const withSlides = (slides: string, front = "title: T\npost_type: 1") => `---\n${front}\n---\n\n${slides}`;

describe("parseSlides", () => {
  it("parses the spec example", () => {
    const file = parseSlides(SPEC);
    expect(file).toMatchObject({ title: "Who we are", postType: 3, formats: ["instagram-carousel"], label: "ABOUT" });
    expect(file.slides.map((s) => s.kind)).toEqual(["cover", "compare", "steps", "cta"]);
    expect(file.slides.map((s) => s.index)).toEqual([0, 1, 2, 3]);

    const cover = file.slides[0]!;
    expect(cover.headline!.text).toBe("This page is made by our software");
    const { start, end } = cover.headline!.accent!;
    expect(cover.headline!.text.slice(start, end)).toBe("our software");
    expect(cover.body).toEqual(["No filming, no faces. Here is why."]);

    const compare = file.slides[1]!;
    expect(compare.items).toEqual([
      { text: "cameras", mark: "bad" },
      { text: "filming", mark: "bad" },
      { text: "graphics", mark: "good" },
      { text: "voice", mark: "good" },
    ]);
    expect(file.slides[2]!.items[0]).toEqual({ text: "Topic", second: "us" });
    expect(file.slides[3]!.button).toBe("Join the waiting list: link in bio");
  });

  it("records the line of each slide", () => {
    expect(parseSlides(SPEC).slides.map((s) => s.line)).toEqual([8, 12, 20, 27]);
  });

  it("reads attributes after the kind", () => {
    const file = parseSlides(withSlides("## image {photo: inbox/shop.jpg}\n# Our shop\n\n## custom {id: phone, size: big}\n"));
    expect(file.slides[0]!.attrs).toEqual({ photo: "inbox/shop.jpg" });
    expect(file.slides[1]).toMatchObject({ kind: "custom", attrs: { id: "phone", size: "big" } });
  });

  it("accepts a single format name and the optional fields", () => {
    const file = parseSlides(withSlides("## cover\n# Hi\n", "title: T\npost_type: 2\nformat: story\nstyle: 13\nsquare: true"));
    expect(file).toMatchObject({ formats: ["story"], style: 13, square: true });
  });

  it("has no formats when the front matter names none", () => {
    expect(parseSlides(withSlides("## cover\n# Hi\n")).formats).toEqual([]);
  });

  it("parses CRLF with a BOM the same as LF", () => {
    expect(parseSlides("﻿" + SPEC.replace(/\n/g, "\r\n"))).toEqual(parseSlides(SPEC));
  });

  it("keeps apostrophes and accents", () => {
    const h = parseSlides(withSlides("## cover\n# L'*app* è pronta\n")).slides[0]!.headline!;
    expect(h.text).toBe("L'app è pronta");
    expect(h.text.slice(h.accent!.start, h.accent!.end)).toBe("app");
  });

  it("leaves a headline without an accent plain", () => {
    expect(parseSlides(withSlides("## cover\n# Plain\n")).slides[0]!.headline).toEqual({ text: "Plain" });
  });

  it("rejects two accent spans, naming the line", () => {
    expect(() => parseSlides(withSlides("## cover\n# A *b* and *c*\n"))).toThrow(/line 7.*accent/i);
  });

  it("rejects an unknown kind, naming the line", () => {
    const run = () => parseSlides(withSlides("## cover\n# Hi\n\n## banner\n# Nope\n"));
    expect(run).toThrow(SlidesError);
    expect(run).toThrow(/line 9.*banner/);
    try {
      run();
    } catch (e) {
      expect((e as SlidesError).line).toBe(9);
    }
  });

  it("rejects a missing title or post_type", () => {
    expect(() => parseSlides(withSlides("## cover\n# Hi\n", "post_type: 1"))).toThrow(/title/);
    expect(() => parseSlides(withSlides("## cover\n# Hi\n", "title: T"))).toThrow(/post_type/);
  });

  it("rejects an unknown format name", () => {
    expect(() => parseSlides(withSlides("## cover\n# Hi\n", "title: T\npost_type: 1\nformat: [reel]"))).toThrow(
      /line 4.*reel.*instagram-carousel/,
    );
  });

  it("rejects missing front matter and a file without slides", () => {
    expect(() => parseSlides("## cover\n# Hi\n")).toThrow(SlidesError);
    expect(() => parseSlides(withSlides(""))).toThrow(/no slides/i);
  });
});
