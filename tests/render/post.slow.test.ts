import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerSlideLayout } from "../../engine/remotion/styles/slideLayouts.js";
import type { Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { renderPost } from "../../engine/src/render/renderPost.js";
import { closeRenders } from "../../engine/src/render/renderVideo.js";
import { PLACEHOLDER_SLIDES, placeholderSlides } from "../fixtures/remotion/placeholderSlides.js";
import { catalogWithSlides } from "../post/catalogWithSlides.js";

// The real post compositions with the test-only slide view of style 99.
const entryPoint = join(import.meta.dirname, "..", "fixtures", "remotion", "postEntry.ts");

const CAROUSEL = `---
title: Who we are
post_type: 3
label: ABOUT
---

## cover
# This page is made by *our software*
No filming, no faces.

## point
# Why *no faces*
You have no time to film.

## cta
# Want posts *like this*?
[Join the list]
`;

const SINGLE = `---
title: One post
post_type: 6
square: true
---

## cover
# New *opening hours*
From Monday we open at eight.
`;

const readPng = (file: string) => PNG.sync.read(readFileSync(file));

function post(slides: string): { pageDir: string; dir: string; page: Page } {
  const pageDir = mkdtempSync(join(tmpdir(), "unfaced post render è "));
  const dir = join(pageDir, "posts", "about-us");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "slides.md"), slides);
  const page: Page = {
    dir: pageDir,
    name: "Studio",
    language: "en",
    niche: "software",
    choices: {},
    postStyle: PLACEHOLDER_SLIDES,
    brand: { handle: "@studio" },
    providers: { voice: "kokoro", ai_clips: "none", images: "none" },
  };
  return { pageDir, dir, page };
}

// Bundles the post compositions and renders in headless Chrome. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("render posts (slow)", () => {
  const catalog = catalogWithSlides();

  beforeAll(() => {
    registerSlideLayout(PLACEHOLDER_SLIDES, placeholderSlides);
  });
  afterAll(async () => {
    await closeRenders();
  });

  it("renders every format at its exact size, and a grid that is not one flat colour", async () => {
    const { pageDir, dir, page } = post(CAROUSEL);
    const { plans } = buildPostPlans(dir, page, catalog, {});
    const [carousel] = plans;
    const files = await renderPost(carousel!, dir, pageDir, { postDir: dir, entryPoint });
    expect(files.map((f) => f.slice(dir.length + 1))).toEqual(["slide-01.png", "slide-02.png", "slide-03.png", "grid.png"]);
    const cover = readPng(files[0]!);
    expect([cover.width, cover.height]).toEqual([1080, 1350]);

    const grid = readPng(files[3]!);
    const colours = new Set<number>();
    for (let i = 0; i < grid.data.length; i += 4 * 97) colours.add(grid.data.readUInt32BE(i));
    expect(colours.size).toBeGreaterThan(2);

    const story = buildPostPlans(dir, page, catalog, { format: "story" }).plans[0]!;
    const [storySlide] = await renderPost(story, join(dir, "story"), pageDir, { postDir: dir, entryPoint });
    const storyPng = readPng(storySlide!);
    expect([storyPng.width, storyPng.height]).toEqual([1080, 1920]);

    const single = post(SINGLE);
    const square = buildPostPlans(single.dir, single.page, catalog, { format: "instagram-post" }).plans[0]!;
    const [squareSlide] = await renderPost(square, single.dir, single.pageDir, { postDir: single.dir, entryPoint });
    const squarePng = readPng(squareSlide!);
    expect([squarePng.width, squarePng.height]).toEqual([1080, 1080]);
  }, 600_000);

  it("draws a post's own slide inside the style's frame, and stops before rendering when an id is not exported", async () => {
    const { pageDir, dir, page } = post(`---
title: Own code
post_type: 3
---

## cover
# Our *app*

## custom {id: square}
`);
    mkdirSync(join(dir, "custom"));
    // The component imports the kit, like a video's scenes do, and draws with the style's colours.
    writeFileSync(join(dir, "custom", "index.tsx"), `import { AbsoluteFill } from "remotion";
import { defineSlides } from "@unfaced/kit";
export default defineSlides({ square: ({ colours }) => <AbsoluteFill><div style={{ position: "absolute", left: 300, top: 500, width: 400, height: 400, background: colours.accent }} /></AbsoluteFill> });
`);
    writeFileSync(join(dir, "custom", "boxes.json"), JSON.stringify({ square: { "instagram-carousel": [] } }));
    const plan = buildPostPlans(dir, page, catalog, {}).plans[0]!;
    const accent = [1, 3, 5].map((i) => parseInt(plan.colours.accent.slice(i, i + 2), 16));
    const files = await renderPost(plan, dir, pageDir, { postDir: dir, entryPoint });
    const png = readPng(files[1]!);
    const at = (x: number, y: number) => (y * png.width + x) * 4;
    expect([...png.data.subarray(at(500, 700), at(500, 700) + 3)]).toEqual(accent);
    // The frame is still drawn: the first slide has none of the square.
    const cover = readPng(files[0]!);
    expect([...cover.data.subarray(at(500, 700), at(500, 700) + 3)]).not.toEqual(accent);

    writeFileSync(join(dir, "custom", "index.tsx"), `import { defineSlides } from "@unfaced/kit";
export default defineSlides({ other: () => null });
`);
    writeFileSync(join(dir, "slides.md"), readFileSync(join(dir, "slides.md"), "utf8"));
    await expect(renderPost(plan, join(dir, "again"), pageDir, { postDir: dir, entryPoint })).rejects.toThrow(/does not export a slide "square"/);
  }, 600_000);
});
