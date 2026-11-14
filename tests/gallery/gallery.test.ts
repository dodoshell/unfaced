import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOG_DEMO_ID } from "../../engine/remotion/compositionId.js";
import { stylesWithLayout } from "../../engine/remotion/styles/layouts.js";
import { Catalog, type CatalogEntry } from "../../engine/src/catalog/catalog.js";
import { buildGallery, type GalleryDeps, galleryHtml, POSTER_FRAME } from "../../engine/src/gallery/gallery.js";
import { CATALOG_KINDS, type CatalogKind } from "../../engine/src/page/types.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { RenderJob } from "../../engine/src/render/renderVideo.js";

const catalog = Catalog.load(CATALOG_DIR);
const cards = (html: string) => html.match(/<article class="card/g) ?? [];

describe("the gallery page", () => {
  it("shows every entry of every catalog, numbered, with planned ones marked", () => {
    const html = galleryHtml(catalog, [], new Set());
    const all = CATALOG_KINDS.flatMap((kind) => catalog.list(kind));
    expect(cards(html)).toHaveLength(all.length);
    expect(html).toContain("<h3>01 Soft 3D</h3>");
    expect(html).toContain("<h3>15 Contrarian take</h3>");
    expect((html.match(/class="status">coming soon</g) ?? []).length).toBe(all.filter((e) => e.status === "planned").length);
  });

  it("shows each hook's first example and each style's poster when there is one", () => {
    const html = galleryHtml(catalog, [{ num: 1, name: "Shocking question", niche: "Animals", text: "Why do cats purr when they're hurt?" }], new Set(["03-flat-cartoon.png"]));
    expect(html).toContain("<q>Why do cats purr when they&#39;re hurt?</q> <span class=\"niche\">Animals</span>");
    expect(html).toContain('<img src="media/03-flat-cartoon.png" alt="The dog demo in 03 Flat cartoon" width="270" height="480" loading="lazy">');
    expect(html).not.toContain('src="media/01-soft-3d.png"');
  });

  it("escapes what the catalog says", () => {
    const entry = (kind: CatalogKind): CatalogEntry => ({ kind, num: 1, slug: "x", name: "A <b> & C", summary: '"quoted"', goodFor: ["<i>"], path: "", status: "ready" });
    const html = galleryHtml({ list: (kind) => [entry(kind)] }, [], new Set());
    expect(html).toContain("01 A &lt;b&gt; &amp; C");
    expect(html).toContain("&quot;quoted&quot;");
    expect(html).not.toContain("<i>");
  });
});

describe("unfaced gallery", () => {
  function deps() {
    const stills: Array<RenderJob & { frame: number; scale?: number }> = [];
    const d: GalleryDeps = { catalog, renderStill: async (job) => void stills.push(job), log: () => {} };
    return { d, stills };
  }

  it("renders a small poster of the dog demo for every style with components, then writes index.html", async () => {
    const out = mkdtempSync(join(tmpdir(), "unfaced gallery "));
    const { d, stills } = deps();
    const page = await buildGallery({ out }, d);
    expect(page).toBe(join(out, "index.html"));
    expect(stills.map((s) => s.inputProps.style)).toEqual(stylesWithLayout());
    expect(stills[0]).toMatchObject({ id: DOG_DEMO_ID, frame: POSTER_FRAME, scale: 0.25 });
    expect(stills[0]!.outPath).toBe(join(out, "media", `${String(stylesWithLayout()[0]).padStart(2, "0")}-${catalog.get("style", stylesWithLayout()[0]!).slug}.png`));
    expect(readFileSync(page, "utf8")).toMatch(/^<!doctype html>/);
  });

  it("keeps the posters it has with --no-stills", async () => {
    const out = mkdtempSync(join(tmpdir(), "unfaced gallery "));
    const { d, stills } = deps();
    await buildGallery({ out, stills: false }, d);
    expect(stills).toEqual([]);
    expect(existsSync(join(out, "index.html"))).toBe(true);
  });
});
