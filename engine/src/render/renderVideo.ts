import { mkdirSync } from "node:fs";
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

const bundles = new Map<string, Promise<string>>();

/** Bundles the composition once per entry point and assets folder. */
function serveUrl(entryPoint: string, assetsDir: string): Promise<string> {
  const key = `${entryPoint}\n${assetsDir}`;
  let url = bundles.get(key);
  if (!url) {
    url = bundle({
      entryPoint,
      publicDir: assetsDir,
      // Our sources import "./x.js" for "./x.ts(x)", the TypeScript ESM convention.
      webpackOverride: (config) => ({
        ...config,
        resolve: { ...config.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js"] } },
      }),
    });
    bundles.set(key, url);
    url.catch(() => bundles.delete(key));
  }
  return url;
}

async function prepare(plan: VideoPlan, outPath: string, options: RenderOptions) {
  const entryPoint = resolve(options.entryPoint ?? join(LIBRARY_ROOT, "engine", "remotion", "index.ts"));
  const url = await serveUrl(entryPoint, resolve(options.assetsDir ?? dirname(outPath)));
  const inputProps = { plan };
  const composition = await selectComposition({ serveUrl: url, id: COMPOSITION_ID, inputProps });
  mkdirSync(dirname(outPath), { recursive: true });
  return { url, inputProps, composition };
}

/** Renders the whole video: 1080×1920, 30 fps, H.264 with AAC audio. */
export async function renderVideo(plan: VideoPlan, outPath: string, options: RenderOptions = {}): Promise<void> {
  const { url, inputProps, composition } = await prepare(plan, outPath, options);
  await renderMedia({ serveUrl: url, composition, inputProps, codec: "h264", audioCodec: "aac", outputLocation: outPath });
}

/** Renders one frame as a PNG. */
export async function renderStillAt(plan: VideoPlan, frame: number, outPath: string, options: RenderOptions = {}): Promise<void> {
  const { url, inputProps, composition } = await prepare(plan, outPath, options);
  await renderStill({ serveUrl: url, composition, inputProps, frame, output: outPath, imageFormat: "png" });
}
