import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { COMPOSITION_ID } from "../../remotion/compositionId.js";
import { LIBRARY_ROOT } from "../paths.js";
import { inboxKind } from "../inbox/inbox.js";
import type { VideoPlan } from "../plan/types.js";

export interface RenderOptions {
  /** Remotion entry point; defaults to the engine's, with every built style. */
  entryPoint?: string;
  /** Folder that the plan's files (soundtrack, inbox/) are relative to; defaults to the output file's folder. */
  assetsDir?: string;
  /** A video's own scene code (its scenes/index.tsx), bundled together with the engine. */
  scenes?: string;
}

/** A composition to render, with the files from `assetsDir` it reads through staticFile(). */
export interface RenderJob {
  id: string;
  inputProps: Record<string, unknown>;
  outPath: string;
  entryPoint?: string;
  assetsDir?: string;
  files?: string[];
  scenes?: string;
}

export const ENGINE_ENTRY = join(LIBRARY_ROOT, "engine", "remotion", "index.ts");
const KIT = join(LIBRARY_ROOT, "engine", "remotion", "kit", "index.ts");

/**
 * The files of a video folder a render reads: the soundtrack and the images, clips and voice
 * dropped into inbox/. Folders, hidden files and other types stay out (`unfaced inbox` reports them).
 */
export function planFiles(plan: VideoPlan, assetsDir: string): string[] {
  const files = plan.audioSrc ? [plan.audioSrc] : [];
  const inbox = join(assetsDir, "inbox");
  if (existsSync(inbox)) {
    const usable = (f: string) => !f.startsWith(".") && inboxKind(f) !== undefined && statSync(join(inbox, f)).isFile();
    files.push(...readdirSync(inbox).filter(usable).map((f) => `inbox/${f}`));
  }
  return files;
}

/**
 * A temporary folder holding only the files the render reads, used as the bundle's public
 * folder: the bundler copies its public folder, and a video folder also holds renders and frames.
 */
export function stagePublicDir(assetsDir: string, files: string | string[]): string {
  const staged = mkdtempSync(join(tmpdir(), "unfaced-public-"));
  for (const file of ([] as string[]).concat(files)) {
    const target = join(staged, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(assetsDir, file), target);
  }
  return staged;
}

const slash = (p: string) => p.replace(/\\/g, "/");

/** An entry point that loads the engine and a video's own scenes; written to a temporary folder. */
function scenesEntry(scenes: string): { entry: string; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "unfaced-entry-"));
  const engine = (p: string) => JSON.stringify(slash(join(LIBRARY_ROOT, "engine", "remotion", p)));
  const source = [
    `import { registerRoot } from "remotion";`,
    `import { RemotionRoot } from ${engine("Root.tsx")};`,
    `import ${engine("styles/installed.ts")};`,
    `import { setVideoScenes } from ${engine("core/videoScenes.ts")};`,
    `import scenes from ${JSON.stringify(slash(resolve(scenes)))};`,
    "setVideoScenes(scenes);",
    "registerRoot(RemotionRoot);",
    "",
  ].join("\n");
  const entry = join(dir, "entry.ts");
  writeFileSync(entry, source);
  return { entry, dir };
}

const bundles = new Map<string, { url: Promise<string>; temp: string[] }>();

/** Bundles once per entry point, scenes and staged files (their paths, sizes and times). */
function serveUrl(entryPoint: string, assetsDir: string, files: string[], scenes?: string): Promise<string> {
  const stats = files.map((f) => {
    const s = statSync(join(assetsDir, f));
    return `${f}:${s.size}:${s.mtimeMs}`;
  });
  const key = [entryPoint, assetsDir, scenes ?? "", ...stats].join("\n");
  let cached = bundles.get(key);
  if (!cached) {
    const staged = stagePublicDir(assetsDir, files);
    const temp = [staged];
    let entry = entryPoint;
    if (scenes) {
      const generated = scenesEntry(scenes);
      entry = generated.entry;
      temp.push(generated.dir);
    }
    const url = bundle({
      entryPoint: entry,
      publicDir: staged,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          // Our sources import "./x.js" for "./x.ts(x)", the TypeScript ESM convention.
          extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
          // A video's scenes/ folder lives in the user's page, outside the library.
          alias: { ...(config.resolve?.alias as Record<string, string> | undefined), "@unfaced/kit": KIT },
          modules: [...(config.resolve?.modules ?? ["node_modules"]), join(LIBRARY_ROOT, "node_modules")],
        },
      }),
    });
    cached = { url, temp };
    bundles.set(key, cached);
    url.catch(() => bundles.delete(key));
  }
  return cached.url;
}

/** Deletes every temporary bundle and staged folder this process made; returns the folders removed. */
export async function closeRenders(): Promise<string[]> {
  const removed: string[] = [];
  for (const { url, temp } of bundles.values()) {
    const dir = await url.catch(() => undefined);
    for (const d of [dir, ...temp]) {
      if (!d) continue;
      rmSync(d, { recursive: true, force: true });
      removed.push(d);
    }
  }
  bundles.clear();
  return removed;
}

async function prepare(job: RenderJob) {
  const entryPoint = resolve(job.entryPoint ?? ENGINE_ENTRY);
  const url = await serveUrl(entryPoint, resolve(job.assetsDir ?? dirname(job.outPath)), job.files ?? [], job.scenes);
  const composition = await selectComposition({ serveUrl: url, id: job.id, inputProps: job.inputProps });
  mkdirSync(dirname(job.outPath), { recursive: true });
  return { url, composition };
}

/** Renders a composition to an H.264 + AAC video. The bundle is kept until closeRenders(). */
export async function renderMediaOf(job: RenderJob): Promise<void> {
  const { url, composition } = await prepare(job);
  await renderMedia({ serveUrl: url, composition, inputProps: job.inputProps, codec: "h264", audioCodec: "aac", outputLocation: job.outPath });
}

/** Renders one frame of a composition as a PNG. The bundle is kept until closeRenders(). */
export async function renderStillOf(job: RenderJob & { frame: number }): Promise<void> {
  const { url, composition } = await prepare(job);
  await renderStill({ serveUrl: url, composition, inputProps: job.inputProps, frame: job.frame, output: job.outPath, imageFormat: "png" });
}

function videoJob(plan: VideoPlan, outPath: string, options: RenderOptions): RenderJob {
  const assetsDir = resolve(options.assetsDir ?? dirname(outPath));
  return { id: COMPOSITION_ID, inputProps: { plan }, outPath, entryPoint: options.entryPoint, assetsDir, files: planFiles(plan, assetsDir), scenes: options.scenes };
}

/** Renders the whole video: 1080×1920, 30 fps, H.264 with AAC audio. Removes the temporary bundle afterwards. */
export async function renderVideo(plan: VideoPlan, outPath: string, options: RenderOptions = {}): Promise<void> {
  try {
    await renderMediaOf(videoJob(plan, outPath, options));
  } finally {
    await closeRenders();
  }
}

/** Renders one frame as a PNG. The bundle is kept for the next frame until closeRenders(). */
export async function renderStillAt(plan: VideoPlan, frame: number, outPath: string, options: RenderOptions = {}): Promise<void> {
  await renderStillOf({ ...videoJob(plan, outPath, options), frame });
}
