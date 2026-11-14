import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG_DIR } from "../paths.js";
import { Catalog } from "./catalog.js";

interface StyleJson {
  id: number;
  slug: string;
  name: string;
  defaultPalette: string[];
}

/** The `style.json` of a style, which must be ready (built). */
export function readStyle(num: number, catalogDir = CATALOG_DIR): StyleJson {
  const entry = Catalog.load(catalogDir).get("style", num);
  const file = join(catalogDir, entry.path);
  if (entry.status !== "ready" || !existsSync(file)) {
    throw new Error(`Style ${num} (${entry.name}) is not built yet; ready styles are listed by "unfaced list style"`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as StyleJson;
}
