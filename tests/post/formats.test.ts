import { describe, expect, it } from "vitest";
import { FORMATS, FORMAT_ALIASES, formatFor } from "../../engine/src/post/formats.js";

describe("post formats", () => {
  it("has the sizes and slide limits of the spec", () => {
    const table = Object.values(FORMATS).map((f) => [f.name, f.width, f.height, f.minSlides, f.maxSlides, f.pdf]);
    expect(table).toEqual([
      ["instagram-carousel", 1080, 1350, 2, 10, false],
      ["instagram-post", 1080, 1350, 1, 1, false],
      ["linkedin-carousel", 1080, 1350, 2, 12, true],
      ["story", 1080, 1920, 1, 10, false],
    ]);
  });

  it("makes an instagram post square on request", () => {
    expect(formatFor("instagram-post", true)).toMatchObject({ width: 1080, height: 1080 });
    expect(formatFor("instagram-post")).toMatchObject({ width: 1080, height: 1350 });
    expect(formatFor("instagram-carousel", true).height).toBe(1350);
    expect(FORMATS["instagram-post"].height).toBe(1350);
  });

  it("names the four formats when one is unknown", () => {
    expect(() => formatFor("reel")).toThrow(/instagram-carousel.*instagram-post.*linkedin-carousel.*story/);
  });

  it("keeps the cover headline inside the central 3:4 area", () => {
    expect(FORMATS["instagram-carousel"].coverArea).toEqual({ x: 0, y: 169, w: 1080, h: 1012 });
  });

  it("keeps story text out of the platform bars", () => {
    expect(FORMATS.story.safe).toEqual({ top: 250, right: 60, bottom: 340, left: 60 });
    expect(FORMATS["instagram-carousel"].safe).toEqual({ top: 60, right: 60, bottom: 60, left: 60 });
  });

  it("maps plain words to formats", () => {
    expect(FORMAT_ALIASES.stories).toBe("story");
    expect(FORMAT_ALIASES.linkedin).toBe("linkedin-carousel");
  });
});
