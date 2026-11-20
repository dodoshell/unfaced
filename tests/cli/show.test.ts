import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { docText, FORMATS } from "../../engine/src/cli/docs.js";
import { pageSummary } from "../../engine/src/cli/page.js";
import { parseSlides } from "../../engine/src/post/parseSlides.js";
import { showText } from "../../engine/src/cli/show.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import { catalogWithNightTech } from "../page/catalogWithNightTech.js";

const catalog = Catalog.load(CATALOG_DIR);

/** A fresh catalog in which style 7 is still planned, whatever the real one says by now. */
function withPlannedStyle(): Catalog {
  const fresh = Catalog.load(CATALOG_DIR);
  fresh.get("style", 7).status = "planned";
  return fresh;
}

describe("unfaced show post-type", () => {
  it("prints each post type with its sections and an example that parses as slides.md", () => {
    for (let n = 1; n <= 6; n++) {
      const text = showText(catalog, "post-type", n);
      for (const heading of ["## What it's for", "## Slides", "## Cover", "## Writing rules", "## Example"]) expect(text, `post type ${n}`).toContain(heading);
      const example = text.split(/^## Example/m)[1]!;
      const block = /```markdown\r?\n([\s\S]*?)\r?\n```/.exec(example);
      expect(block, `post type ${n} example`).not.toBeNull();
      const file = parseSlides(block![1]!);
      expect(file.postType).toBe(n);
      expect(file.slides.length).toBeGreaterThanOrEqual(5);
      expect(file.slides.length).toBeLessThanOrEqual(8);
    }
  });
});

describe("unfaced show", () => {
  it("prints one entry's own section of a shared catalog file", () => {
    const text = showText(catalog, "hook", 4);
    expect(text).toMatch(/^## 04 Impossible image/);
    expect(text).toContain("**Status:** ready");
    expect(text).not.toContain("## 05");
  });

  it("adds the rules every entry of the kind follows after the entry's own section", () => {
    const hook = showText(catalog, "hook", 1);
    expect(hook).toMatch(/^## 01 Shocking question/);
    expect(hook).toContain("Rules for every hook:\n\n- Under 12 words");
    expect(hook).toContain("Write it for the ear");
    expect(hook).not.toContain("## 02");
    expect(hook).not.toContain("Each hook below has three examples");
    expect(showText(catalog, "ending", 5)).toContain("Rules for every ending:");
    expect(showText(catalog, "duration", 2)).toContain("Pacing rules for every length:");
    expect(showText(catalog, "voice", 1)).not.toMatch(/rules for every/i);
  });

  it("prints a whole catalog file, rules included, when no number is given", () => {
    const text = showText(catalog, "ending");
    expect(text).toMatch(/^# Endings/);
    expect(text).toContain("## 06 Callback to the hook");
  });

  it("prints a script type's file and a style's STYLE.md", () => {
    expect(showText(catalog, "script", 6)).toMatch(/^# 06 Surprising answer/m);
    expect(showText(catalog, "style", 3)).toMatch(/flat cartoon/i);
  });

  it("says plainly when an entry is planned and has nothing to show yet", () => {
    expect(showText(withPlannedStyle(), "style", 7)).toMatch(/07 Paper cut-out.*planned.*not available yet/s);
  });

  it("names the catalogs when the kind is wrong", () => {
    expect(() => showText(catalog, "hooks", 1)).toThrow(/Unknown catalog "hooks".*hook/);
  });
});

describe("unfaced docs", () => {
  it("prints every format document and lists them when no name is given", () => {
    // slides.md is written with the post commands; until then `unfaced docs slides` says there is no such file.
    for (const name of FORMATS.filter((f) => f !== "slides")) expect(docText(name).length, name).toBeGreaterThan(200);
    expect(FORMATS).toContain("brand");
    expect(docText()).toContain("script");
    expect(() => docText("nope")).toThrow(/No format "nope".*script/);
  });
});

describe("unfaced page", () => {
  function page(yaml: string): string {
    const dir = mkdtempSync(join(tmpdir(), "unfaced page "));
    writeFileSync(join(dir, "page.yaml"), yaml);
    return dir;
  }

  it("summarises a valid page: every choice by name, ready or not, the mascot and the videos", async () => {
    const dir = page("name: Curious Cats\nlanguage: en\nniche: cat facts\nstyle: 3\nscript: [6, 9]\nvoice: 1\nmusic: auto\nduration: 30-45\n");
    mkdirSync(join(dir, "videos", "why-cats-purr"), { recursive: true });
    writeFileSync(join(dir, "videos", "why-cats-purr", "script.md"), "");
    const lines = await pageSummary(dir, catalog);
    expect(lines).toEqual(
      expect.arrayContaining([
        "Curious Cats (en): cat facts",
        "style: 3 Flat cartoon",
        "script: one of 6 Surprising answer, 9 Did you know",
        "music: auto (the agent picks from the ready ones)",
        "duration: 30–45 s",
        "mascot: none (brand/mascot/mascot.json)",
        "videos: 1",
      ]),
    );
  });

  it("marks a fixed choice that is not ready yet", async () => {
    const lines = await pageSummary(page("name: P\nlanguage: en\nniche: x\nstyle: 7\n"), withPlannedStyle());
    expect(lines).toContain("style: 7 Paper cut-out (planned: not available yet)");
  });

  it("summarises the posts side of a page: style, post types, formats and brand", async () => {
    const dir = page(
      [
        "name: Studio", "language: it", "niche: web studio", "style: { posts: 13, videos: 3 }", "post_type: [1, 3]",
        "formats: [instagram-carousel, story]", "brand:", '  handle: "@studionord"', "  site: studionord.it",
        "  logo: brand/logo.svg", "  fonts: { display: brand/fonts/A.ttf }", "  tone: direct, warm", "",
      ].join("\n"),
    );
    mkdirSync(join(dir, "brand", "fonts"), { recursive: true });
    writeFileSync(join(dir, "brand", "logo.svg"), "<svg/>");
    writeFileSync(join(dir, "brand", "fonts", "A.ttf"), "x");
    const lines = await pageSummary(dir, catalogWithNightTech("ready"));
    expect(lines).toContain("style: 3 Flat cartoon");
    expect(lines).toContain("Posts: style 13 Night tech · post types 1, 3 · formats instagram-carousel, story");
    const brand = lines.find((l) => l.startsWith("Brand:"))!;
    for (const part of ["@studionord", "studionord.it", "brand/logo.svg", "display brand/fonts/A.ttf", "direct, warm"]) expect(brand).toContain(part);
    expect(lines.some((l) => l.startsWith("warning"))).toBe(false);
  });

  it("warns when the post style cannot make posts yet, naming the styles that can", async () => {
    const yaml = "name: P\nlanguage: en\nniche: x\nstyle: { posts: 13 }\n";
    const none = await pageSummary(page(yaml), catalogWithNightTech("planned"));
    expect(none.find((l) => l.startsWith("warning"))).toMatch(/style 13 Night tech cannot make posts yet; no style makes posts yet/);
    expect(none).toContain("style: none (set style.videos to make videos)");
    const other = catalogWithNightTech("planned");
    other.get("style", 12).posts = "ready";
    const some = await pageSummary(page(yaml), other);
    expect(some.find((l) => l.startsWith("warning"))).toMatch(/cannot make posts yet; styles that can: 12 Kinetic typography/);
  });

  it("warns that font is ignored", async () => {
    const lines = await pageSummary(page("name: P\nlanguage: en\nniche: x\nfont: Inter\n"), catalog);
    expect(lines.find((l) => l.includes('"font" is ignored; use brand.fonts'))).toBeDefined();
  });

  it("explains what is wrong with an invalid page", async () => {
    await expect(pageSummary(page("name: P\nlanguage: en\n"), catalog)).rejects.toThrow(/niche/);
  });
});
