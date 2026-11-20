import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";

/** The real catalog with style 13 Night tech's posts set to `posts` (the catalog has them planned until the style is finished). */
export function catalogWithNightTech(posts: "ready" | "planned" = "ready"): Catalog {
  const dir = mkdtempSync(join(tmpdir(), "unfaced catalog "));
  const raw = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
  const entry = raw.style.find((e: { num: number }) => e.num === 13);
  entry.posts = posts;
  writeFileSync(join(dir, "catalog.json"), JSON.stringify(raw));
  return Catalog.load(dir);
}
