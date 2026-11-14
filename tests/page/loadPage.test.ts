import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPage, PageError } from "../../engine/src/page/loadPage.js";
import { stubCatalog } from "./stubCatalog.js";

const fixture = join(import.meta.dirname, "..", "fixtures", "pages", "curious-cats");

function pageDir(yaml: string): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced page "));
  writeFileSync(join(dir, "page.yaml"), yaml);
  return dir;
}

const minimal = "name: Test\nlanguage: en\nniche: tests\n";

async function errorOf(yaml: string): Promise<PageError> {
  try {
    await loadPage(pageDir(yaml), stubCatalog);
  } catch (e) {
    if (e instanceof PageError) return e;
    throw e;
  }
  throw new Error("expected a PageError");
}

describe("loadPage", () => {
  it("loads the spec's example profile", async () => {
    const page = await loadPage(fixture, stubCatalog);
    expect(page.name).toBe("Curious Cats");
    expect(page.choices.style).toBe(7);
    expect(page.choices.script).toEqual([2, 6, 9]);
    expect(page.choices.hook).toBe("auto");
    expect(page.duration).toEqual({ minSec: 30, maxSec: 45 });
    expect(page.mascot).toBe("Miso, an orange cat with round glasses");
  });

  it("defaults providers to the free ones", async () => {
    const page = await loadPage(pageDir(minimal), stubCatalog);
    expect(page.providers).toEqual({ voice: "free", ai_clips: "none", images: "none" });
  });

  it("rejects a style number outside the catalog and names the valid range", async () => {
    const err = await errorOf(`${minimal}style: 99\n`);
    expect(err.field).toBe("style");
    expect(err.message).toContain("style");
    expect(err.message).toContain("1–12");
  });

  it("rejects a number inside a list that is outside the catalog", async () => {
    const err = await errorOf(`${minimal}script: [2, 40]\n`);
    expect(err.field).toBe("script");
    expect(err.message).toContain("1–10");
  });

  it("names an unknown field and suggests the closest known one", async () => {
    const err = await errorOf(`${minimal}stlye: 3\n`);
    expect(err.field).toBe("stlye");
    expect(err.message).toContain("style");
  });

  it("refuses API keys stored in page.yaml", async () => {
    const err = await errorOf(`${minimal}providers:\n  voice: sk-abc123secret\n`);
    expect(err.message).toBe("API keys must not be stored in page.yaml; use .env");
  });

  it("accepts a single number of seconds as duration", async () => {
    const page = await loadPage(pageDir(`${minimal}duration: 30\n`), stubCatalog);
    expect(page.duration).toEqual({ minSec: 30, maxSec: 30 });
  });

  it("explains a missing page.yaml", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced empty "));
    await expect(loadPage(dir, stubCatalog)).rejects.toThrow(/page\.yaml not found/);
  });
});
