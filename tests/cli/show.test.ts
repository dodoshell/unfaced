import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { docText, FORMATS } from "../../engine/src/cli/docs.js";
import { pageSummary } from "../../engine/src/cli/page.js";
import { showText } from "../../engine/src/cli/show.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";

const catalog = Catalog.load(CATALOG_DIR);

describe("unfaced show", () => {
  it("prints one entry's own section of a shared catalog file", () => {
    const text = showText(catalog, "hook", 4);
    expect(text).toMatch(/^## 04 Impossible image/);
    expect(text).toContain("**Status:** ready");
    expect(text).not.toContain("## 05");
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
    expect(showText(catalog, "style", 7)).toMatch(/07 Paper cut-out.*planned.*not available yet/s);
  });

  it("names the catalogs when the kind is wrong", () => {
    expect(() => showText(catalog, "hooks", 1)).toThrow(/Unknown catalog "hooks".*hook/);
  });
});

describe("unfaced docs", () => {
  it("prints every format document and lists them when no name is given", () => {
    for (const name of FORMATS) expect(docText(name).length, name).toBeGreaterThan(200);
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
    const lines = await pageSummary(page("name: P\nlanguage: en\nniche: x\nstyle: 7\n"), catalog);
    expect(lines).toContain("style: 7 Paper cut-out (planned: not available yet)");
  });

  it("explains what is wrong with an invalid page", async () => {
    await expect(pageSummary(page("name: P\nlanguage: en\n"), catalog)).rejects.toThrow(/niche/);
  });
});
