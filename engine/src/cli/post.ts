import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Catalog } from "../catalog/catalog.js";
import { checkPost } from "../check/post.js";
import { toReport } from "../check/types.js";
import { loadPage } from "../page/loadPage.js";
import { CATALOG_DIR } from "../paths.js";
import { buildPostPlans, type PostPlan } from "../post/buildPostPlan.js";
import { writePdf } from "../post/pdf.js";
import type { FormatName } from "../post/types.js";
import { type PostRenderOptions, renderPost } from "../render/renderPost.js";
import { closeRenders } from "../render/renderVideo.js";
import { summaryLines } from "./check.js";

export interface PostDeps {
  catalog: Catalog;
  /** Renders one format's slides and grid into `outDir`; returns the slides' paths, then the grid's. */
  render(plan: PostPlan, outDir: string, pageDir: string, options: PostRenderOptions): Promise<string[]>;
  writePdf(pngs: string[], out: string): Promise<void>;
  /** Closes the browser and removes the bundle once every format is rendered. */
  close(): Promise<unknown>;
  log(msg: string): void;
}

export const defaultPostDeps = (): PostDeps => ({
  catalog: Catalog.load(CATALOG_DIR),
  render: renderPost,
  writePdf,
  close: closeRenders,
  log: (msg) => console.error(msg),
});

/**
 * Makes the post in `<postDir>/slides.md` with the page profile two folders up
 * (`<page>/posts/<post>/`): writes post-plan.json (one plan per format) and check.json, then
 * renders slide-01.png…, grid.png and, for linkedin-carousel, post.pdf. With several formats
 * each one's files go in `<postDir>/<format>/`. A failed check still renders, so the user can
 * see why; `pass` says whether every check passed.
 */
export async function makePost(postDir: string, deps: PostDeps = defaultPostDeps(), opts: { format?: FormatName } = {}): Promise<{ pass: boolean; files: string[] }> {
  const dir = resolve(postDir);
  if (!existsSync(join(dir, "slides.md"))) throw new Error(`slides.md not found in ${dir}`);
  const pageDir = resolve(dir, "..", "..");
  const page = await loadPage(pageDir, deps.catalog);
  const { plans, warnings } = buildPostPlans(dir, page, deps.catalog, opts);
  for (const warning of warnings) deps.log(warning);
  writeFileSync(join(dir, "post-plan.json"), `${JSON.stringify(plans, null, 2)}\n`);
  const report = toReport(plans.flatMap(checkPost));
  writeFileSync(join(dir, "check.json"), `${JSON.stringify(report, null, 2)}\n`);

  const files: string[] = [];
  try {
    for (const plan of plans) {
      const outDir = plans.length > 1 ? join(dir, plan.format.name) : dir;
      deps.log(`Rendering ${plan.slides.length} ${plan.format.name} slide${plan.slides.length === 1 ? "" : "s"} (${plan.format.width}×${plan.format.height})`);
      const pngs = await deps.render(plan, outDir, pageDir, { postDir: dir });
      files.push(...pngs);
      if (plan.format.pdf) {
        const pdf = join(outDir, "post.pdf");
        await deps.writePdf(pngs.slice(0, plan.slides.length), pdf);
        files.push(pdf);
      }
    }
  } finally {
    await deps.close();
  }
  deps.log(`Done: ${plans.length > 1 ? plans.map((p) => join(dir, p.format.name)).join(", ") : dir}`);
  for (const line of summaryLines(report, { times: false })) deps.log(line);
  return { pass: report.pass, files };
}
