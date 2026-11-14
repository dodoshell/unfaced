import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { type HeadlessBrowser, openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
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
  /** How renderMediaOf encodes: H.264 + AAC by default, or a looping GIF with every nth frame, scaled. */
  media?: { codec: "gif"; everyNthFrame: number; scale: number };
  /** How many browser tabs render frames at once; Remotion picks from the CPU count when unset. */
  concurrency?: number;
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
    `setVideoScenes(scenes, ${JSON.stringify(resolve(scenes))});`,
    "registerRoot(RemotionRoot);",
    "",
  ].join("\n");
  const entry = join(dir, "entry.ts");
  writeFileSync(entry, source);
  return { entry, dir };
}

const bundles = new Map<string, Promise<string>>();
/** Every temporary folder a bundle made, kept apart from `bundles` so a failed bundle's folders are deleted too. */
const temporary: string[] = [];

/** Bundles once per entry point, scenes and staged files (their paths, sizes and times). */
function serveUrl(entryPoint: string, assetsDir: string, files: string[], scenes?: string): Promise<string> {
  const stats = files.map((f) => {
    const s = statSync(join(assetsDir, f));
    return `${f}:${s.size}:${s.mtimeMs}`;
  });
  // With no files to stage, the folder they would come from changes nothing in the bundle.
  const key = [entryPoint, files.length > 0 ? assetsDir : "", scenes ?? "", ...stats].join("\n");
  let url = bundles.get(key);
  if (!url) {
    const staged = stagePublicDir(assetsDir, files);
    const outDir = mkdtempSync(join(tmpdir(), "unfaced-bundle-"));
    temporary.push(staged, outDir);
    let entry = entryPoint;
    if (scenes) {
      const generated = scenesEntry(scenes);
      entry = generated.entry;
      temporary.push(generated.dir);
    }
    url = bundle({
      entryPoint: entry,
      outDir,
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
    bundles.set(key, url);
    url.catch(() => bundles.delete(key));
  }
  return url;
}

const browsers = new Map<number, Promise<HeadlessBrowser>>();

/**
 * Headless Chrome for renders at `scale`, started once and shared until closeRenders(): left to
 * itself, Remotion starts one to read the composition and another for each render, about a second each.
 */
function browserAt(scale: number): Promise<HeadlessBrowser> {
  let browser = browsers.get(scale);
  if (!browser) {
    browser = openBrowser("chrome", { forceDeviceScaleFactor: scale });
    browsers.set(scale, browser);
    browser.catch(() => browsers.delete(scale));
  }
  return browser;
}

/** Closes the browsers and deletes every temporary bundle and staged folder this process made; returns the folders removed. */
export async function closeRenders(): Promise<string[]> {
  const open = [...browsers.values()];
  browsers.clear();
  for (const browser of open) await (await browser.catch(() => undefined))?.close({ silent: true });
  await Promise.allSettled(bundles.values());
  bundles.clear();
  compositions.clear();
  const removed = temporary.splice(0);
  for (const dir of removed) rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  return removed;
}

type Composition = Awaited<ReturnType<typeof selectComposition>>;
const compositions = new Map<string, Promise<Composition>>();

/** Reads a composition once per bundle, browser and props: the frames of one video all share it. */
function compositionOf(url: string, job: RenderJob, scale: number, browser: HeadlessBrowser): Promise<Composition> {
  const key = [url, scale, job.id, JSON.stringify(job.inputProps)].join("\n");
  let composition = compositions.get(key);
  if (!composition) {
    composition = selectComposition({ serveUrl: url, id: job.id, inputProps: job.inputProps, puppeteerInstance: browser });
    compositions.set(key, composition);
    composition.catch(() => compositions.delete(key));
  }
  return composition;
}

async function prepare(job: RenderJob, scale: number) {
  const entryPoint = resolve(job.entryPoint ?? ENGINE_ENTRY);
  const url = await serveUrl(entryPoint, resolve(job.assetsDir ?? dirname(job.outPath)), job.files ?? [], job.scenes);
  const browser = await browserAt(scale);
  const composition = await compositionOf(url, job, scale, browser);
  mkdirSync(dirname(job.outPath), { recursive: true });
  return { url, composition, browser };
}

/** Renders a composition to an H.264 + AAC video (or the GIF `job.media` asks for). The bundle and browser are kept until closeRenders(). */
export async function renderMediaOf(job: RenderJob): Promise<void> {
  const { url, composition, browser } = await prepare(job, job.media?.scale ?? 1);
  const encoding = job.media
    ? { codec: "gif" as const, everyNthFrame: job.media.everyNthFrame, scale: job.media.scale, numberOfGifLoops: null }
    : // A silent track when the video has no soundtrack (text only, no music): players and platforms expect one.
      { codec: "h264" as const, audioCodec: "aac" as const, enforceAudioTrack: true };
  await renderMedia({ serveUrl: url, composition, inputProps: job.inputProps, ...encoding, outputLocation: job.outPath, puppeteerInstance: browser, concurrency: job.concurrency ?? null });
}

/** Renders one frame of a composition as a PNG, optionally scaled. The bundle and browser are kept until closeRenders(). */
export async function renderStillOf(job: RenderJob & { frame: number; scale?: number }): Promise<void> {
  const scale = job.scale ?? 1;
  const { url, composition, browser } = await prepare(job, scale);
  await renderStill({ serveUrl: url, composition, inputProps: job.inputProps, frame: job.frame, output: job.outPath, imageFormat: "png", scale, puppeteerInstance: browser });
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

/** Renders one frame as a PNG. The bundle and browser are kept for the next frame until closeRenders(). */
export async function renderStillAt(plan: VideoPlan, frame: number, outPath: string, options: RenderOptions = {}): Promise<void> {
  await renderStillOf({ ...videoJob(plan, outPath, options), frame });
}
