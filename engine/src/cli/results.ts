import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Catalog } from "../catalog/catalog.js";
import { compareResults, parseResults, readVideoFacts, type VideoFacts } from "../results/results.js";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * `unfaced results <pageDir>`: results.md joined with what each video was made with, compared per
 * platform. Fails when a row can't be read or names a video the page doesn't have.
 */
export async function resultsReport(pageDir: string, catalog: Catalog, today = new Date()): Promise<{ lines: string[]; pass: boolean }> {
  const dir = resolve(pageDir);
  const file = join(dir, "results.md");
  if (!existsSync(file)) return { lines: [`No results.md in ${dir} yet. After posting, record each video's numbers there (format: unfaced docs results).`], pass: false };

  const { rows, problems } = parseResults(readFileSync(file, "utf8"));
  const facts = new Map<string, VideoFacts>();
  for (const row of rows) {
    if (facts.has(row.video)) continue;
    const videoDir = join(dir, "videos", row.video);
    if (row.video && existsSync(videoDir)) facts.set(row.video, readVideoFacts(videoDir));
    else problems.push(`row ${row.row}: no folder videos/${row.video}; the Video column must be a folder name in videos/`);
  }
  const videos = new Set(rows.map((r) => r.video)).size;
  const platforms = new Set(rows.map((r) => r.platform.toLowerCase())).size;
  const lines = [`Results: ${plural(rows.length, "row")}, ${plural(videos, "video")}, ${plural(platforms, "platform")}`, "", ...compareResults(rows, facts, catalog, today, problems)];
  return { lines, pass: problems.length === 0 };
}
