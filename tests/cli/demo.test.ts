import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_FRAMES, type DemoDeps, renderDemos } from "../../engine/src/cli/demo.js";
import { DOG_DEMO_ID } from "../../engine/remotion/compositionId.js";
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
    expect(videos.map((v) => v.inputProps.style)).toEqual(stylesWithLayout());
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
