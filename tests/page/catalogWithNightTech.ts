import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";

/** The real catalog plus style 13 Night tech, which the catalog gets in a later task; `posts` is its post status. */
export function catalogWithNightTech(posts: "ready" | "planned" = "ready"): Catalog {
  const dir = mkdtempSync(join(tmpdir(), "unfaced catalog "));
  const raw = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
  raw.style.push({ num: 13, slug: "night-tech", name: "Night tech", summary: "Near-black navy with a soft blue glow.", goodFor: ["software"], path: "styles/13-night-tech/style.json", status: "planned", posts });
  writeFileSync(join(dir, "catalog.json"), JSON.stringify(raw));
  return Catalog.load(dir);
}
