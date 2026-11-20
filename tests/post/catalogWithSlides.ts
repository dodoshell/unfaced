import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import { PLACEHOLDER_SLIDES } from "../fixtures/remotion/placeholderSlides.js";

const fixture = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "remotion", "placeholderSlides.json");

/** The real catalog plus the test-only slide style 99, whose folder is tests/fixtures/remotion. */
export function catalogWithSlides(posts: "ready" | "planned" = "ready"): Catalog {
  const dir = mkdtempSync(join(tmpdir(), "unfaced catalog "));
  const raw = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
  raw.style.push({ num: PLACEHOLDER_SLIDES, slug: "placeholder-slides", name: "Placeholder slides", summary: "Plain boxes for tests.", goodFor: ["tests"], path: fixture, status: "planned", posts });
  writeFileSync(join(dir, "catalog.json"), JSON.stringify(raw));
  return Catalog.load(dir);
}
