import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Catalog } from "../catalog/catalog.js";
import { loadPage } from "../page/loadPage.js";
import { checkBrandFiles } from "../page/brand.js";
import { loadMascot } from "../page/mascot.js";
import { CHOICE_FIELDS, type Choice, type Page } from "../page/types.js";

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
    if (field === "style" && choice === undefined && page.postStyle !== undefined) lines.push("style: none (set style.videos to make videos)");
    else if (choice === undefined || choice === "auto") lines.push(`${field}: auto (the agent picks from the ready ones)`);
    else if (Array.isArray(choice)) lines.push(`${field}: one of ${choice.map((n) => named(field, n)).join(", ")}`);
    else lines.push(`${field}: ${named(field, choice)}`);
  }
  if (page.duration) {
    const { minSec, maxSec } = page.duration;
    lines.push(`duration: ${minSec === maxSec ? minSec : `${minSec}–${maxSec}`} s`);
  }
  if (page.palette) lines.push(`palette: ${page.palette.join(" ")}`);
  lines.push(...postLines(page, catalog));
  lines.push(mascot ? `mascot: ${mascot.name}, a ${mascot.rig.species} (brand/mascot/mascot.json)` : "mascot: none (brand/mascot/mascot.json)");
  const videos = join(dir, "videos");
  const count = existsSync(videos) ? readdirSync(videos).filter((v) => existsSync(join(videos, v, "script.md"))).length : 0;
  lines.push(`videos: ${count}`);
  if (page.font !== undefined) lines.push('warning: "font" is ignored; use brand.fonts');
  return lines;
}

/** The posts line, the brand line and the warning when the post style cannot make posts yet. */
function postLines(page: Page, catalog: Catalog): string[] {
  const lines: string[] = [];
  const list = (choice: Choice | undefined, name: (n: number) => string) =>
    choice === undefined || choice === "auto" ? "auto" : Array.isArray(choice) ? `one of ${choice.map(name).join(", ")}` : name(choice);
  const parts: string[] = [];
  if (page.postStyle !== undefined) parts.push(`style ${list(page.postStyle, (n) => `${n} ${catalog.get("style", n).name}`)}`);
  if (page.postType !== undefined) parts.push(`post types ${page.postType === "auto" ? "auto" : [page.postType].flat().join(", ")}`);
  if (page.formats) parts.push(`formats ${page.formats.join(", ")}`);
  if (parts.length) lines.push(`Posts: ${parts.join(" · ")}`);

  const chosen = page.postStyle === undefined || page.postStyle === "auto" ? [] : [page.postStyle].flat();
  const cannot = chosen.filter((n) => catalog.get("style", n).posts !== "ready");
  if (cannot.length) {
    const can = catalog.list("style").filter((e) => e.posts === "ready");
    const names = cannot.map((n) => `style ${n} ${catalog.get("style", n).name}`).join(", ");
    lines.push(`warning: ${names} cannot make posts yet; ${can.length ? `styles that can: ${can.map((e) => `${e.num} ${e.name}`).join(", ")}` : "no style makes posts yet"}`);
  }

  const brand = page.brand;
  if (brand) {
    checkBrandFiles(page);
    const bits = [
      brand.handle,
      brand.site,
      brand.logo && `logo ${brand.logo}`,
      brand.fonts && Object.keys(brand.fonts).length ? `fonts ${Object.entries(brand.fonts).map(([role, file]) => `${role} ${file}`).join(", ")}` : undefined,
      brand.tone && `tone "${brand.tone}"`,
    ].filter(Boolean);
    lines.push(`Brand: ${bits.length ? bits.join(" · ") : "(empty)"}`);
  }
  return lines;
}
