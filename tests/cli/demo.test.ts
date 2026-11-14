import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_FRAMES, type DemoDeps, renderDemos } from "../../engine/src/cli/demo.js";
import { DOG_DEMO_ID, STYLES_GRID_ID } from "../../engine/remotion/compositionId.js";
import { stylesWithLayout } from "../../engine/remotion/styles/layouts.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { RenderJob } from "../../engine/src/render/renderVideo.js";

function deps() {
  const videos: RenderJob[] = [];
  const stills: Array<RenderJob & { frame: number }> = [];
  const d: DemoDeps = {
    catalog: Catalog.load(CATALOG_DIR),
    renderMedia: async (job) => void videos.push(job),
    renderStill: async (job) => void stills.push(job),
    log: () => {},
  };
  return { d, videos, stills };
}

const out = join("some where", "demos");

describe("demo", () => {
  it("renders the dog demo of one style to <out>/NN-slug.mp4", async () => {
    const { d, videos } = deps();
    const files = await renderDemos("3", { out }, d);
    expect(files).toEqual([join(out, "03-flat-cartoon.mp4")]);
    expect(videos).toEqual([expect.objectContaining({ id: DOG_DEMO_ID, inputProps: { style: 3 }, outPath: join(out, "03-flat-cartoon.mp4") })]);
  });

  it("renders every style that has components with all", async () => {
    const { d, videos } = deps();
    await renderDemos("all", { out }, d);
    expect(videos.filter((v) => v.id === DOG_DEMO_ID).map((v) => v.inputProps.style)).toEqual(stylesWithLayout());
  });

  it("puts every demo side by side after all: a vertical video and the README's GIF", async () => {
    const { d, videos } = deps();
    const gif = join("docs", "media", "styles-grid.gif");
    const files = await renderDemos("all", { out, gif }, d);
    const grids = videos.filter((v) => v.id === STYLES_GRID_ID);
    const cells = stylesWithLayout().map((n) => {
      const entry = Catalog.load(CATALOG_DIR).get("style", n);
      return { src: `${String(n).padStart(2, "0")}-${entry.slug}.mp4`, label: `${String(n).padStart(2, "0")} ${entry.name}` };
    });
    expect(grids).toEqual([
      expect.objectContaining({ outPath: join(out, "all-styles.mp4"), inputProps: { cells, bands: true }, assetsDir: out, files: cells.map((c) => c.src) }),
      expect.objectContaining({ outPath: gif, inputProps: { cells, bands: false }, assetsDir: out, media: { codec: "gif", everyNthFrame: 3, scale: 0.5 } }),
    ]);
    expect(files.slice(-2)).toEqual([join(out, "all-styles.mp4"), gif]);
  });

  it("renders the grid in one browser tab, since each tab plays every style's video", async () => {
    const { d, videos } = deps();
    await renderDemos("all", { out }, d);
    const grids = videos.filter((v) => v.id === STYLES_GRID_ID);
    expect(grids.map((g) => g.concurrency)).toEqual([1, 1]);
    expect(videos.filter((v) => v.id === DOG_DEMO_ID).every((v) => v.concurrency === undefined)).toBe(true);
  });

  it("makes no grid for a single style or for stills", async () => {
    const { d, videos } = deps();
    await renderDemos("3", { out }, d);
    await renderDemos("all", { out, frames: true }, d);
    expect(videos.some((v) => v.id === STYLES_GRID_ID)).toBe(false);
  });

  it("renders review stills instead of the video with --frames", async () => {
    const { d, videos, stills } = deps();
    const files = await renderDemos("3", { out, frames: true }, d);
    expect(videos).toEqual([]);
    expect(stills.map((s) => s.frame)).toEqual(DEMO_FRAMES);
    expect(files[0]).toBe(join(out, "03-flat-cartoon", `frame-${String(DEMO_FRAMES[0]).padStart(3, "0")}.png`));
  });

  it("names the styles it can show when asked for one without components", async () => {
    const { d } = deps();
    const planned = Catalog.load(CATALOG_DIR).list("style").find((s) => !stylesWithLayout().includes(s.num));
    if (planned) await expect(renderDemos(String(planned.num), { out }, d)).rejects.toThrow(/has no components yet.*styles with components/);
    await expect(renderDemos("dog", { out }, d)).rejects.toThrow(/a style number or "all"/);
  });
});
