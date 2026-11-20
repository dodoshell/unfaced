import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { loadPage } from "../../engine/src/page/loadPage.js";
import { loadMascot } from "../../engine/src/page/mascot.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
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

describe("the Studio Nord example page", () => {
  const dir = join(pagesDir, "studio-nord");

  it("makes posts in style 13 as carousels for Instagram and LinkedIn", async () => {
    const page = await loadPage(dir, Catalog.load(CATALOG_DIR));
    expect(page.postStyle).toBe(13);
    expect(page.formats).toEqual(["instagram-carousel", "linkedin-carousel"]);
    expect(page.brand?.handle).toBe("@studionord");
  });

  it("has an about-us carousel of eight slides that builds a plan for each format", async () => {
    const page = await loadPage(dir, Catalog.load(CATALOG_DIR));
    const { plans } = buildPostPlans(join(dir, "posts", "about-us"), page, Catalog.load(CATALOG_DIR));
    expect(plans.map((p) => p.format.name)).toEqual(["instagram-carousel", "linkedin-carousel"]);
    for (const plan of plans) expect(plan.slides).toHaveLength(8);
  });
});
