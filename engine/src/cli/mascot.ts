import { join, resolve } from "node:path";
import { MASCOT_SHEET_ID } from "../../remotion/compositionId.js";
import { Catalog } from "../catalog/catalog.js";
import { readStyle } from "../catalog/styles.js";
import { loadPage } from "../page/loadPage.js";
import { loadMascot, mascotDir } from "../page/mascot.js";
import { CATALOG_DIR } from "../paths.js";
import { closeRenders, type RenderJob, renderStillOf } from "../render/renderVideo.js";
import { choose } from "./make.js";

export interface MascotDeps {
  catalog: Catalog;
  renderStill(job: RenderJob & { frame: number }): Promise<void>;
  log(msg: string): void;
}

const defaultDeps = (): MascotDeps => ({ catalog: Catalog.load(CATALOG_DIR), renderStill: renderStillOf, log: (m) => console.error(m) });

/**
 * Renders the page's mascot reference sheet (every pose, in the page's style) to
 * brand/mascot/reference.png and returns its path.
 */
export async function renderMascotSheet(pageDir: string, deps: MascotDeps = defaultDeps()): Promise<string> {
  const dir = resolve(pageDir);
  const page = await loadPage(dir, deps.catalog);
  const mascot = loadMascot(dir);
  if (!mascot) throw new Error(`${dir} has no mascot yet: write brand/mascot/mascot.json (fields: schema/mascot.schema.json)`);
  const style = choose("style", page, deps);
  const palette = page.palette ?? readStyle(style).defaultPalette;
  const outPath = join(mascotDir(dir), "reference.png");
  try {
    await deps.renderStill({ id: MASCOT_SHEET_ID, inputProps: { style, mascot, palette }, outPath, frame: 0 });
  } finally {
    await closeRenders();
  }
  deps.log(`Wrote ${mascot.name}'s reference sheet (style ${style}) to ${outPath}`);
  return outPath;
}
