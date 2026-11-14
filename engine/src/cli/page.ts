import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Catalog } from "../catalog/catalog.js";
import { loadPage } from "../page/loadPage.js";
import { loadMascot } from "../page/mascot.js";
import { CHOICE_FIELDS } from "../page/types.js";

/**
 * Lines for `unfaced page <pageDir>`: the page profile as the engine reads it, with every
 * catalog choice named, so an agent can check a page it wrote. Throws on an invalid profile.
 */
export async function pageSummary(pageDir: string, catalog: Catalog): Promise<string[]> {
  const dir = resolve(pageDir);
  const page = await loadPage(dir, catalog);
  const mascot = loadMascot(dir);
  const named = (field: (typeof CHOICE_FIELDS)[number], num: number) => {
    const entry = catalog.get(field, num);
    return `${num} ${entry.name}${entry.status === "planned" ? " (planned: not available yet)" : ""}`;
  };
  const lines = [`${page.name} (${page.language}): ${page.niche}`];
  for (const field of CHOICE_FIELDS) {
    const choice = page.choices[field];
    if (choice === undefined || choice === "auto") lines.push(`${field}: auto (the agent picks from the ready ones)`);
    else if (Array.isArray(choice)) lines.push(`${field}: one of ${choice.map((n) => named(field, n)).join(", ")}`);
    else lines.push(`${field}: ${named(field, choice)}`);
  }
  if (page.duration) {
    const { minSec, maxSec } = page.duration;
    lines.push(`duration: ${minSec === maxSec ? minSec : `${minSec}–${maxSec}`} s`);
  }
  if (page.palette) lines.push(`palette: ${page.palette.join(" ")}`);
  lines.push(mascot ? `mascot: ${mascot.name}, a ${mascot.rig.species} (brand/mascot/mascot.json)` : "mascot: none (brand/mascot/mascot.json)");
  const videos = join(dir, "videos");
  const count = existsSync(videos) ? readdirSync(videos).filter((v) => existsSync(join(videos, v, "script.md"))).length : 0;
  lines.push(`videos: ${count}`);
  return lines;
}
