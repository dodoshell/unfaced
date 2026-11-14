import { join } from "node:path";
import { DOG_DEMO_ID } from "../../remotion/compositionId.js";
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
}

/** The moments worth a look: the run, the take-off, the catch, the landing, the end. */
export const DEMO_FRAMES = [0, 40, 72, 80, 86, 95, 105, 140, 179];

const defaultDeps = (): DemoDeps => ({ catalog: Catalog.load(CATALOG_DIR), renderMedia: renderMediaOf, renderStill: renderStillOf, log: (m) => console.error(m) });

/**
 * Renders the dog demo of one style ("3") or of every style with components ("all") to
 * `<out>/NN-slug.mp4`, or with `frames` its key moments to `<out>/NN-slug/frame-NNN.png`.
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
  } finally {
    await closeRenders();
  }
  return files;
}
