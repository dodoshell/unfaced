import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Catalog } from "../catalog/catalog.js";
import { videoEnv } from "../env.js";
import { fitPortrait } from "../generate/fit.js";
import { type GenerateDeps, generateMissing } from "../generate/generate.js";
import { parsePrompts, type Probe, probeMedia, PROMPTS_FILE } from "../inbox/inbox.js";
import { runFfmpeg } from "../ffmpeg.js";
import { loadPage } from "../page/loadPage.js";
import { CATALOG_DIR } from "../paths.js";
import { inboxReport } from "./inbox.js";

export type { GenerateDeps } from "../generate/generate.js";

export const defaultGenerateDeps = (videoDir: string): GenerateDeps => ({
  catalog: Catalog.load(CATALOG_DIR),
  env: videoEnv(videoDir),
  fetch,
  sleep: (ms) => new Promise((done) => setTimeout(done, ms)),
  now: Date.now,
  fit: (src, dest, size) => fitPortrait(src, dest, runFfmpeg, size),
  log: (msg) => console.error(msg),
});

/**
 * `unfaced generate`: one line per prompt it made, left for manual handoff or failed on, then
 * the same lines as `unfaced inbox`. Fails when a provider failed or a file can't be used.
 */
export async function generateReport(videoDir: string, deps: GenerateDeps = defaultGenerateDeps(videoDir), probe: (path: string) => Promise<Probe> = probeMedia): Promise<{ lines: string[]; pass: boolean }> {
  const dir = resolve(videoDir);
  const promptsFile = join(dir, "inbox", PROMPTS_FILE);
  if (!existsSync(promptsFile)) {
    const none = `No inbox/${PROMPTS_FILE} in ${dir}: nothing to generate.`;
    if (!existsSync(join(dir, "inbox"))) return { lines: [none], pass: true };
    const inbox = await inboxReport(dir, probe);
    return { lines: [none, ...inbox.lines], pass: inbox.pass };
  }
  const page = await loadPage(resolve(dir, "..", ".."), deps.catalog);
  const made = await generateMissing(dir, parsePrompts(readFileSync(promptsFile, "utf8")), page, deps);
  const inbox = await inboxReport(dir, probe);
  return {
    lines: [...made.map((l) => `${l.status.padEnd(8)} ${l.file} — ${l.detail}`), ...(made.length > 0 ? [""] : []), ...inbox.lines],
    pass: inbox.pass && made.every((l) => l.status !== "failed"),
  };
}
