import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PostPlan } from "../../engine/src/post/buildPostPlan.js";
import { postFiles } from "../../engine/src/render/renderPost.js";
import { slideContext } from "../../engine/remotion/post/PostSlide.js";

function plan(pageDir: string, logo?: string): PostPlan {
  const font = join(pageDir, "A.ttf");
  return { brand: logo ? { logo } : {}, fonts: { display: font, accent: font, text: font, mono: font }, slides: [] } as unknown as PostPlan;
}

describe("postFiles", () => {
  it("stages the logo at brand/logo.<ext>, however page.yaml writes its path", () => {
    const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
    mkdirSync(join(pageDir, "brand"));
    writeFileSync(join(pageDir, "brand", "logo.svg"), "svg");
    for (const logo of ["./brand/logo.svg", "brand\\logo.svg", "brand/logo.svg"]) {
      const files = postFiles(plan(pageDir, logo), pageDir);
      expect(files["brand/logo.svg"], logo).toBe(join(pageDir, "brand", "logo.svg"));
      expect(Object.keys(files).filter((f) => f.includes("logo")), logo).toEqual(["brand/logo.svg"]);
    }
  });

  it("stages each image slide's photo at photos/slide-NN.<ext>", () => {
    const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
    const photo = join(pageDir, "posts", "p", "inbox", "Shop.JPG");
    const slides = [
      { slide: { index: 0, kind: "cover", attrs: {}, body: [], items: [], line: 1 }, boxes: [], fitted: {} },
      { slide: { index: 1, kind: "image", attrs: { photo: "inbox/Shop.JPG" }, body: [], items: [], line: 5 }, boxes: [], fitted: {}, photo },
    ];
    const files = postFiles({ ...plan(pageDir), slides } as unknown as PostPlan, pageDir);
    expect(files["photos/slide-02.jpg"]).toBe(photo);
    expect(Object.keys(files).filter((f) => f.startsWith("photos/"))).toEqual(["photos/slide-02.jpg"]);
  });

  it("refuses a logo outside the page folder", () => {
    const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
    expect(() => postFiles(plan(pageDir, "../outside.png"), pageDir)).toThrow(/brand\.logo.*inside the page folder/);
  });

  it("tells the slide view where the logo is staged, and nothing when there is none", () => {
    const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
    const slides = [{ slide: { index: 0, kind: "cover", attrs: {}, body: [], items: [], line: 1 }, boxes: [], fitted: {} }];
    const withLogo = { ...plan(pageDir, "brand\\Logo.PNG"), slides, language: "en", palette: [], format: { name: "story" } } as unknown as PostPlan;
    expect(slideContext(withLogo, 0).logoFile).toBe("brand/logo.png");
    expect(slideContext({ ...withLogo, brand: {} }, 0).logoFile).toBeUndefined();
    expect(slideContext({ ...withLogo, logoAspect: 3.5 }, 0).logoAspect).toBe(3.5);
    expect(slideContext(withLogo, 0).logoAspect).toBeUndefined();
  });
});
