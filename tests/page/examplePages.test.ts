import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { loadPage } from "../../engine/src/page/loadPage.js";
import { loadMascot } from "../../engine/src/page/mascot.js";
import { CATALOG_DIR, LIBRARY_ROOT } from "../../engine/src/paths.js";

const pagesDir = join(LIBRARY_ROOT, "examples", "pages");
const pages = readdirSync(pagesDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe("the example pages", () => {
  it("are at least three, in more than one language", async () => {
    const catalog = Catalog.load(CATALOG_DIR);
    const loaded = await Promise.all(pages.map((p) => loadPage(join(pagesDir, p), catalog)));
    expect(loaded.length).toBeGreaterThanOrEqual(3);
    expect(new Set(loaded.map((p) => p.language)).size).toBeGreaterThan(1);
  });

  it.each(pages)("%s has a valid profile, and a valid mascot when it has one", async (page) => {
    await expect(loadPage(join(pagesDir, page), Catalog.load(CATALOG_DIR))).resolves.toBeDefined();
    expect(() => loadMascot(join(pagesDir, page))).not.toThrow();
  });
});
