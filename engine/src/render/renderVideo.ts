import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { COMPOSITION_ID } from "../../remotion/compositionId.js";
import { LIBRARY_ROOT } from "../paths.js";
import type { VideoPlan } from "../plan/types.js";

export interface RenderOptions {
  /** Remotion entry point; defaults to the engine's, with every built style. */
  entryPoint?: string;
  /** Folder that the plan's audioSrc is relative to; defaults to the output file's folder. */
  assetsDir?: string;
}

/**
 * A temporary folder holding only the voice-over, used as the bundle's public folder:
 * the bundler copies its public folder, and the video folder also holds renders and frames.
 */
export function stagePublicDir(assetsDir: string, audioSrc: string): string {
  const staged = mkdtempSync(join(tmpdir(), "unfaced-public-"));
  const target = join(staged, audioSrc);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(assetsDir, audioSrc), target);
  return staged;
}

const bundles = new Map<string, { url: Promise<string>; staged: string }>();

/** Bundles the composition once per entry point and voice-over (its path, size and time). */
function serveUrl(entryPoint: string, assetsDir: string, audioSrc: string): Promise<string> {
  const audio = statSync(join(assetsDir, audioSrc));
  const key = [entryPoint, assetsDir, audioSrc, audio.size, audio.mtimeMs].join("\n");
  let cached = bundles.get(key);
  if (!cached) {
    const staged = stagePublicDir(assetsDir, audioSrc);
    const url = bundle({
      entryPoint,
      publicDir: staged,
      // Our sources import "./x.js" for "./x.ts(x)", the TypeScript ESM convention.
      webpackOverride: (config) => ({
        ...config,
        resolve: { ...config.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js"] } },
      }),
    });
    cached = { url, staged };
    bundles.set(key, cached);
    url.catch(() => bundles.delete(key));
  }
  return cached.url;
}

/** Deletes every temporary bundle and staged folder this process made; returns the folders removed. */
export async function closeRenders(): Promise<string[]> {
  const removed: string[] = [];
  for (const { url, staged } of bundles.values()) {
    const dir = await url.catch(() => undefined);
    for (const d of [dir, staged]) {
      if (!d) continue;
      rmSync(d, { recursive: true, force: true });
      removed.push(d);
    }
  }
  bundles.clear();
  return removed;
}

async function prepare(plan: VideoPlan, outPath: string, options: RenderOptions) {
  const entryPoint = resolve(options.entryPoint ?? join(LIBRARY_ROOT, "engine", "remotion", "index.ts"));
  const url = await serveUrl(entryPoint, resolve(options.assetsDir ?? dirname(outPath)), plan.audioSrc);
  const inputProps = { plan };
  const composition = await selectComposition({ serveUrl: url, id: COMPOSITION_ID, inputProps });
  mkdirSync(dirname(outPath), { recursive: true });
  return { url, inputProps, composition };
}

/** Renders the whole video: 1080×1920, 30 fps, H.264 with AAC audio. Removes the temporary bundle afterwards. */
export async function renderVideo(plan: VideoPlan, outPath: string, options: RenderOptions = {}): Promise<void> {
  try {
    const { url, inputProps, composition } = await prepare(plan, outPath, options);
    await renderMedia({ serveUrl: url, composition, inputProps, codec: "h264", audioCodec: "aac", outputLocation: outPath });
  } finally {
    await closeRenders();
  }
}

/** Renders one frame as a PNG. The bundle is kept for the next frame until closeRenders(). */
export async function renderStillAt(plan: VideoPlan, frame: number, outPath: string, options: RenderOptions = {}): Promise<void> {
  const { url, inputProps, composition } = await prepare(plan, outPath, options);
  await renderStill({ serveUrl: url, composition, inputProps, frame, output: outPath, imageFormat: "png" });
}
