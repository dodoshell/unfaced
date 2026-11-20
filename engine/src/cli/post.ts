import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Catalog } from "../catalog/catalog.js";
import { checkPost } from "../check/post.js";
import { toReport } from "../check/types.js";
import { checkBrandFiles } from "../page/brand.js";
import { loadPage } from "../page/loadPage.js";
import { CATALOG_DIR } from "../paths.js";
import { buildPostPlans, type PostPlan } from "../post/buildPostPlan.js";
import { formatFor } from "../post/formats.js";
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
  // A brand font or logo that is missing, of the wrong kind or outside the page folder stops here, before anything renders.
  checkBrandFiles(page);
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
      const pdf = join(outDir, "post.pdf");
      if (plan.format.pdf) {
        await deps.writePdf(pngs.slice(0, plan.slides.length), pdf);
        files.push(pdf);
      } else {
        // Left from an earlier linkedin-carousel render of this post into the same folder.
        rmSync(pdf, { force: true });
      }
    }
  } finally {
    await deps.close();
  }
  deps.log(`Done: ${plans.length > 1 ? plans.map((p) => join(dir, p.format.name)).join(", ") : dir}`);
  for (const line of summaryLines(report, { times: false })) deps.log(line);
  return { pass: report.pass, files };
}

/**
 * The arguments of `unfaced post`: the post folder and `--format <name>`, in either order. An
 * unknown format or option fails with the formats or the usage.
 */
export function parsePostArgs(args: string[]): { dir: string; format?: FormatName } {
  let dir: string | undefined;
  let format: FormatName | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--format") {
      const name = args[++i];
      if (!name) throw new Error("--format needs a format name, such as instagram-carousel");
      format = formatFor(name).name;
    } else if (arg.startsWith("--")) {
      throw new Error(`unfaced post takes only --format; "${arg}" is not an option (use square: true in slides.md for a square post)`);
    } else if (dir === undefined) {
      dir = arg;
    } else {
      throw new Error(`unfaced post takes one post folder; got "${dir}" and "${arg}"`);
    }
  }
  if (dir === undefined) throw new Error("Missing the post folder: unfaced post <postDir> [--format <name>]");
  return format ? { dir, format } : { dir };
}
