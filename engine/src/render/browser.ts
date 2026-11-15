// Remotion downloads its browser next to the package.json above the working directory, or into
// ./.remotion: from a user's page folder that is a second browser in the page. unfaced always uses
// the library's. remotionPlatform and libraryBrowserPath copy Remotion's unexported getPlatform and
// getExecutablePath (@remotion/renderer/dist/browser/BrowserFetcher.js): check them on upgrades.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureBrowser } from "@remotion/renderer";
import { LIBRARY_ROOT } from "../paths.js";

/** Remotion's name for this platform's browser download. */
function remotionPlatform(platform: NodeJS.Platform, arch: string): string {
  if (platform === "win32") return "win64";
  if (platform === "darwin") return arch === "arm64" ? "mac-arm64" : "mac-x64";
  if (platform === "linux") return arch === "arm64" ? "linux-arm64" : "linux64";
  throw new Error(`Rendering isn't supported on ${platform}`);
}

/** Where the library's headless browser is, whether or not it has been downloaded yet. */
export function libraryBrowserPath(root = LIBRARY_ROOT, platform = process.platform, arch = process.arch): string {
  const name = remotionPlatform(platform, arch);
  const folder = join(root, "node_modules", ".remotion", "chrome-headless-shell", name, `chrome-headless-shell-${name}`);
  const legacy = join(folder, "headless_shell");
  if (existsSync(legacy)) return legacy;
  return join(folder, platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell");
}

let ensured: Promise<string> | undefined;

/** The library's headless browser, downloaded or updated in the library once per process. */
export function libraryBrowser(): Promise<string> {
  ensured ??= (async () => {
    const cwd = process.cwd();
    process.chdir(LIBRARY_ROOT);
    try {
      await ensureBrowser();
    } finally {
      process.chdir(cwd);
    }
    const path = libraryBrowserPath();
    if (!existsSync(path)) throw new Error(`The render browser is missing from ${path}: run "unfaced doctor"`);
    return path;
  })();
  ensured.catch(() => (ensured = undefined));
  return ensured;
}
