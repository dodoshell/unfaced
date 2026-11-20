import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIBRARY_ROOT } from "../paths.js";

/** The file formats an agent writes or reads, documented in docs/formats/<name>.md. */
export const FORMATS = ["page", "script", "mascot", "scenes", "review", "post", "results", "brand", "slides"] as const;

const DIR = join(LIBRARY_ROOT, "docs", "formats");

/** Text for `unfaced docs [name]`: one format document, or the list of them. */
export function docText(name?: string): string {
  if (name === undefined) {
    return [`Formats (unfaced docs <name>):`, ...FORMATS.map((f) => `  ${f}`)].join("\n");
  }
  const file = join(DIR, `${name}.md`);
  if (!(FORMATS as readonly string[]).includes(name) || !existsSync(file)) {
    throw new Error(`No format "${name}". Choose one of: ${FORMATS.join(", ")}`);
  }
  return readFileSync(file, "utf8").trimEnd();
}
