import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { POST_GRID_ID, POST_SLIDE_ID } from "../../remotion/compositionId.js";
import { SLIDE_FONT_ROLES, slideFontFile, slideLogoFile } from "../../remotion/post/slideFonts.js";
import { brandPath } from "../page/brand.js";
import { inboxKind } from "../inbox/inbox.js";
import type { PostPlan } from "../post/buildPostPlan.js";
import { ownSlides } from "./ownSlides.js";
import { renderStillOf } from "./renderVideo.js";

export interface PostRenderOptions {
  /** The post's folder, whose inbox/ images the slides read as `inbox/<file>`. */
  postDir?: string;
  /** Remotion entry point; defaults to the engine's, with every built style. */
  entryPoint?: string;
}

/**
 * What a post render reads through staticFile(), by public path: the four fonts as
 * fonts/<role>.<ext>, the brand's logo as brand/logo.<ext> (SlideContext.logoFile), and the
 * post's inbox/ images as inbox/<file>. A logo outside the page folder is refused.
 */
export function postFiles(plan: PostPlan, pageDir: string, postDir?: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const role of SLIDE_FONT_ROLES) files[slideFontFile(role, plan.fonts[role])] = plan.fonts[role];
  if (plan.brand.logo) files[slideLogoFile(plan.brand.logo)] = brandPath(pageDir, "brand.logo", plan.brand.logo);
  const inbox = postDir && join(postDir, "inbox");
  if (inbox && existsSync(inbox)) {
    for (const f of readdirSync(inbox)) {
      if (!f.startsWith(".") && inboxKind(f) === "image" && statSync(join(inbox, f)).isFile()) files[`inbox/${f}`] = join(inbox, f);
    }
  }
  return files;
}

const slideName = (i: number) => `slide-${String(i + 1).padStart(2, "0")}.png`;

/**
 * Renders each slide of one format to `<outDir>/slide-01.png…` and all of them side by side to
 * `<outDir>/grid.png`, in one browser session; returns the slides' paths, then the grid's. Slides
 * left from an earlier, longer render are removed. The bundle and browser are kept until closeRenders().
 */
export async function renderPost(plan: PostPlan, outDir: string, pageDir: string, options: PostRenderOptions = {}): Promise<string[]> {
  const dir = resolve(outDir);
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (/^slide-\d+\.png$/.test(f)) rmSync(join(dir, f));
  const ids = [...new Set(plan.slides.flatMap(({ slide }) => (slide.kind === "custom" && slide.attrs.id ? [slide.attrs.id] : [])))];
  const file = options.postDir ? ownSlides(options.postDir) : undefined;
  if (ids.length > 0 && !file) throw new Error(`The post has custom slides (${ids.join(", ")}) but no custom/index.tsx to draw them`);
  const job = { ...(file && { slides: { file, ids } }), entryPoint: options.entryPoint, assetsDir: resolve(pageDir), staged: postFiles(plan, pageDir, options.postDir), frame: 0 };
  const files: string[] = [];
  for (let index = 0; index < plan.slides.length; index++) {
    const outPath = join(dir, slideName(index));
    await renderStillOf({ ...job, id: POST_SLIDE_ID, inputProps: { plan, index }, outPath });
    files.push(outPath);
  }
  const grid = join(dir, "grid.png");
  await renderStillOf({ ...job, id: POST_GRID_ID, inputProps: { plan }, outPath: grid });
  return [...files, grid];
}
