import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Catalog } from "../catalog/catalog.js";
import { CATALOG_KINDS, type CatalogKind } from "../page/types.js";

/** The section of a shared catalog file that starts at `## NN ` and runs to the next `## `. */
function section(text: string, num: number): string {
  const start = text.search(new RegExp(`^## ${String(num).padStart(2, "0")} `, "m"));
  if (start < 0) return "";
  const rest = text.slice(start);
  const next = rest.slice(3).search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next + 3)).trimEnd();
}

/** A shared file's "Rules for every hook:" line and the list under it, or "" when it has none. */
function sharedRules(text: string): string {
  const match = /^.*\brules for every\b.*:\r?\n\r?\n(?:- .*(?:\r?\n|$))+/im.exec(text.slice(0, text.search(/^## /m)));
  return match ? match[0].trimEnd() : "";
}

/**
 * Text for `unfaced show <kind> [num]`: an entry's documentation (its section of a shared
 * file such as hooks.md followed by the rules every entry of that file follows, a script
 * type's file, a style's STYLE.md), or with no number the kind's whole shared file.
 */
export function showText(catalog: Catalog, kind: string, num?: number): string {
  if (!(CATALOG_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Unknown catalog "${kind}". Choose one of: ${CATALOG_KINDS.join(", ")}`);
  }
  const entries = catalog.list(kind as CatalogKind);
  if (num === undefined) {
    const shared = entries[0]?.path.split("#")[0];
    if (shared && entries.every((e) => e.path.startsWith(`${shared}#`))) return readFileSync(join(catalog.root, shared), "utf8").trimEnd();
    return entries.map((e) => `${String(e.num).padStart(2, "0")}  ${e.name} — ${e.summary}${e.status === "planned" ? " (planned)" : ""}`).join("\n");
  }
  const entry = catalog.get(kind as CatalogKind, num);
  const title = `${String(entry.num).padStart(2, "0")} ${entry.name}`;
  if (entry.status === "planned") return `${title} — ${entry.summary}\n\nThis ${kind} is planned: not available yet. See "unfaced list ${kind}" for the ready ones.`;
  const [file, anchor] = entry.path.split("#");
  const path = join(catalog.root, file!);
  if (anchor) {
    const text = readFileSync(path, "utf8");
    return [section(text, entry.num), sharedRules(text)].filter(Boolean).join("\n\n");
  }
  // A style is a folder: its STYLE.md describes it.
  const styleDoc = join(dirname(path), "STYLE.md");
  if (path.endsWith("style.json") && existsSync(styleDoc)) return readFileSync(styleDoc, "utf8").trimEnd();
  return readFileSync(path, "utf8").trimEnd();
}
