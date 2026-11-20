import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkBrandFiles } from "../../engine/src/page/brand.js";
import type { Page } from "../../engine/src/page/types.js";

function pageWith(brand: Page["brand"], files: string[] = []): Page {
  const dir = mkdtempSync(join(tmpdir(), "unfaced brand "));
  for (const f of files) {
    mkdirSync(join(dir, f, ".."), { recursive: true });
    writeFileSync(join(dir, f), "x");
  }
  return { dir, name: "P", language: "en", niche: "n", choices: {}, providers: { voice: "free", ai_clips: "none", images: "none" }, brand };
}

describe("checkBrandFiles", () => {
  it("returns the absolute paths of the brand files that exist", () => {
    const page = pageWith({ logo: "brand/logo.svg", fonts: { display: "brand/fonts/A.ttf", text: "brand/fonts/B.woff" } }, ["brand/logo.svg", "brand/fonts/A.ttf", "brand/fonts/B.woff"]);
    expect(checkBrandFiles(page).sort()).toEqual(["brand/fonts/A.ttf", "brand/fonts/B.woff", "brand/logo.svg"].map((f) => join(page.dir, f)).sort());
  });

  it("returns nothing for a page without brand files", () => {
    expect(checkBrandFiles(pageWith(undefined))).toEqual([]);
    expect(checkBrandFiles(pageWith({ handle: "@x" }))).toEqual([]);
  });

  it("names a font file that is missing", () => {
    expect(() => checkBrandFiles(pageWith({ fonts: { display: "brand/fonts/X.ttf" } }))).toThrow(/brand\.fonts\.display.*brand\/fonts\/X\.ttf/);
  });

  it("says what fonts are accepted when a font file is missing or is a folder", () => {
    expect(() => checkBrandFiles(pageWith({ fonts: { display: "brand/fonts/X.ttf" } }))).toThrow(/brand\/fonts\/X\.ttf.*use \.ttf, \.otf or \.woff/);
    const page = pageWith({ fonts: { text: "brand/fonts/Dir.ttf" } });
    mkdirSync(join(page.dir, "brand", "fonts", "Dir.ttf"), { recursive: true });
    expect(() => checkBrandFiles(page)).toThrow(/Dir\.ttf.*use \.ttf, \.otf or \.woff/);
  });

  it("rejects a font that is not .ttf, .otf or .woff", () => {
    expect(() => checkBrandFiles(pageWith({ fonts: { text: "brand/fonts/X.woff2" } }, ["brand/fonts/X.woff2"]))).toThrow(/use \.ttf, \.otf or \.woff/);
  });

  it("rejects a logo that is not .svg or .png, and one that is missing", () => {
    expect(() => checkBrandFiles(pageWith({ logo: "brand/logo.jpg" }, ["brand/logo.jpg"]))).toThrow(/\.svg or \.png/);
    expect(() => checkBrandFiles(pageWith({ logo: "brand/logo.png" }))).toThrow(/brand\.logo.*brand\/logo\.png/);
  });

  it("puts the field in the error", () => {
    try {
      checkBrandFiles(pageWith({ logo: "logo.jpg" }, ["logo.jpg"]));
      expect.unreachable();
    } catch (e) {
      expect((e as { field: string }).field).toBe("brand.logo");
    }
  });
});
