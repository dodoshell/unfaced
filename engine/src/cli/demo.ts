import { join } from "node:path";
import { DOG_DEMO_ID, STYLES_GRID_ID } from "../../remotion/compositionId.js";
import { stylesWithLayout } from "../../remotion/styles/layouts.js";
import { Catalog } from "../catalog/catalog.js";
import { CATALOG_DIR, LIBRARY_ROOT } from "../paths.js";
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
