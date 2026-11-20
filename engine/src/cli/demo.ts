import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOG_DEMO_ID, STYLES_GRID_ID } from "../../remotion/compositionId.js";
import { stylesWithLayout } from "../../remotion/styles/layouts.js";
import { getSlideLayout, stylesWithSlides } from "../../remotion/styles/slideLayouts.js";
import { Catalog } from "../catalog/catalog.js";
import { checkPost } from "../check/post.js";
import type { Page } from "../page/types.js";
import { CATALOG_DIR, LIBRARY_ROOT } from "../paths.js";
import { buildPostPlans, type PostPlan } from "../post/buildPostPlan.js";
import { samplePhoto, sampleSlides, sampleVisuals } from "../post/samples.js";
import type { FormatName, SlideKind } from "../post/types.js";
import { renderPost } from "../render/renderPost.js";
import { closeRenders, type RenderJob, renderMediaOf, renderStillOf } from "../render/renderVideo.js";

export interface DemoDeps {
  catalog: Catalog;
  renderMedia(job: RenderJob): Promise<void>;
  renderStill(job: RenderJob & { frame: number }): Promise<void>;
  log(msg: string): void;
}

export interface DemoOptions {
  /** Folder for the demos; defaults to examples/styles in the library. */
  out?: string;
  /** Review stills of the key moments instead of the video. */
  frames?: boolean;
  /** Where "all" writes the README's grid GIF; defaults to docs/media/styles-grid.gif in the library. */
  gif?: string;
}

/** The README GIF: every 3rd frame (10 fps) at half size, to stay small. */
const GIF = { codec: "gif", everyNthFrame: 3, scale: 0.5 } as const;

/** The moments worth a look: the run, the take-off, the catch, the landing, the end. */
export const DEMO_FRAMES = [0, 40, 72, 80, 86, 95, 105, 140, 179];

/** Browser tabs rendering the grid at once. */
const GRID_CONCURRENCY = 1;

const defaultDeps = (): DemoDeps => ({ catalog: Catalog.load(CATALOG_DIR), renderMedia: renderMediaOf, renderStill: renderStillOf, log: (m) => console.error(m) });

/**
 * Renders the dog demo of one style ("3") or of every style with components ("all") to
 * `<out>/NN-slug.mp4`, or with `frames` its key moments to `<out>/NN-slug/frame-NNN.png`.
 * "all" then puts the demos side by side in `<out>/all-styles.mp4` and the README's GIF.
 * Returns the files written.
 */
export async function renderDemos(which: string, options: DemoOptions = {}, deps: DemoDeps = defaultDeps()): Promise<string[]> {
  const built = stylesWithLayout();
  const styles = which === "all" ? built : [Number(which)];
  if (which !== "all" && !Number.isInteger(styles[0])) throw new Error(`demo needs a style number or "all", got "${which}"`);
  for (const style of styles) {
    if (!built.includes(style)) throw new Error(`Style ${style} has no components yet; styles with components: ${built.join(", ")}`);
  }
  const out = options.out ?? join(LIBRARY_ROOT, "examples", "styles");
  const files: string[] = [];
  try {
    for (const style of styles) {
      const entry = deps.catalog.get("style", style);
      const name = `${String(style).padStart(2, "0")}-${entry.slug}`;
      if (options.frames) {
        for (const frame of DEMO_FRAMES) {
          const outPath = join(out, name, `frame-${String(frame).padStart(3, "0")}.png`);
          await deps.renderStill({ id: DOG_DEMO_ID, inputProps: { style }, outPath, frame });
          files.push(outPath);
        }
      } else {
        const outPath = join(out, `${name}.mp4`);
        await deps.renderMedia({ id: DOG_DEMO_ID, inputProps: { style }, outPath });
        files.push(outPath);
      }
      deps.log(`Style ${style} (${entry.name}): ${options.frames ? join(out, name) : join(out, `${name}.mp4`)}`);
    }
    if (which === "all" && !options.frames) {
      const cells = styles.map((style) => {
        const entry = deps.catalog.get("style", style);
        const n = String(style).padStart(2, "0");
        return { src: `${n}-${entry.slug}.mp4`, label: `${n} ${entry.name}` };
      });
      // Every tab of the grid decodes all the demos at full size: a tab per CPU core ran out of memory, and two tabs still lost frames.
      const grid = { id: STYLES_GRID_ID, assetsDir: out, files: cells.map((c) => c.src), concurrency: GRID_CONCURRENCY };
      const video = join(out, "all-styles.mp4");
      await deps.renderMedia({ ...grid, inputProps: { cells, bands: true }, outPath: video });
      deps.log(`All styles: ${video}`);
      const gif = options.gif ?? join(LIBRARY_ROOT, "docs", "media", "styles-grid.gif");
      await deps.renderMedia({ ...grid, inputProps: { cells, bands: false }, outPath: gif, media: GIF });
      deps.log(`README grid: ${gif}`);
      files.push(video, gif);
    }
  } finally {
    await closeRenders();
  }
  return files;
}

export interface PostDemoDeps {
  catalog: Catalog;
  /** Renders one format's slides and grid into `outDir`; returns the slides' paths, then the grid's. */
  render(plan: PostPlan, outDir: string, pageDir: string): Promise<string[]>;
  close(): Promise<unknown>;
  log(msg: string): void;
}

/** The formats the post demo shows: the carousel and the story. */
export const POST_DEMO_FORMATS: FormatName[] = ["instagram-carousel", "story"];

const ALL_KINDS: SlideKind[] = ["cover", "point", "list", "steps", "compare", "stat", "quote", "image", "cta", "custom"];

const defaultPostDemoDeps = (): PostDemoDeps => ({ catalog: Catalog.load(CATALOG_DIR), render: (plan, outDir, pageDir) => renderPost(plan, outDir, pageDir), close: closeRenders, log: (m) => console.error(m) });

/**
 * Renders the sample post (engine/src/post/samples.ts: one slide per kind the style draws) in one
 * style ("13") or every style with slides ("all"), as a carousel and a story, into
 * `<out>/NN-slug/<format>/slide-01.png…` and `grid.png`, and the cover visuals' sample into
 * `<out>/NN-slug/visuals/<format>/`; each sample's slides.md (and the image slide's photo, in
 * inbox/) is written next to them. A style whose posts are still planned in the catalog is shown
 * too, since this is how it is looked at while it is built. Check issues are logged, not fatal.
 * Returns the files written.
 */
export async function renderPostDemos(which: string, options: { out?: string } = {}, deps: PostDemoDeps = defaultPostDemoDeps()): Promise<string[]> {
  const built = stylesWithSlides();
  const styles = which === "all" ? built : [Number(which)];
  if (which !== "all" && !Number.isInteger(styles[0])) throw new Error(`demo needs a style number or "all", got "${which}"`);
  for (const style of styles) {
    if (!built.includes(style)) throw new Error(`Style ${style} has no slides yet; styles with slides: ${built.join(", ") || "none yet"}`);
  }
  const out = resolve(options.out ?? join(LIBRARY_ROOT, "examples", "posts"));
  const files: string[] = [];
  try {
    for (const style of styles) {
      const entry = deps.catalog.get("style", style);
      const dir = join(out, `${String(style).padStart(2, "0")}-${entry.slug}`);
      const kinds = getSlideLayout(style).kinds ?? ALL_KINDS;
      const posts = [{ dir, slides: sampleSlides(style, { kinds, formats: POST_DEMO_FORMATS }) }];
      if (kinds.includes("cover")) posts.push({ dir: join(dir, "visuals"), slides: sampleVisuals(style, POST_DEMO_FORMATS) });
      for (const post of posts) {
        mkdirSync(join(post.dir, "inbox"), { recursive: true });
        writeFileSync(join(post.dir, "slides.md"), post.slides);
        if (post.slides.includes("inbox/photo.png")) writeFileSync(join(post.dir, "inbox", "photo.png"), samplePhoto());
        const page: Page = { dir: post.dir, name: "Studio Nord", language: "en", niche: "websites for small businesses", choices: {}, postStyle: style, brand: { handle: "@studionord" }, providers: { voice: "kokoro", ai_clips: "none", images: "none" } };
        const { plans, warnings } = buildPostPlans(post.dir, page, deps.catalog, { allowPlanned: true });
        for (const warning of warnings) deps.log(warning);
        for (const plan of plans) {
          for (const issue of checkPost(plan)) deps.log(`Check: ${issue.message}`);
          files.push(...(await deps.render(plan, join(post.dir, plan.format.name), post.dir)));
        }
      }
      deps.log(`Style ${style} (${entry.name}) posts: ${dir}`);
    }
  } finally {
    await deps.close();
  }
  return files;
}
