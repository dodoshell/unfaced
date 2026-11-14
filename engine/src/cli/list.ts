import { Catalog } from "../catalog/catalog.js";
import { CATALOG_KINDS, type CatalogKind } from "../page/types.js";

/** Lines for `unfaced list <kind>`: `NN  Name — summary`, with `(planned)` after entries not built yet. */
export function listLines(catalog: Catalog, kind: string): string[] {
  if (!(CATALOG_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Unknown catalog "${kind}". Choose one of: ${CATALOG_KINDS.join(", ")}`);
  }
  return catalog.list(kind as CatalogKind).map((e) => {
    const line = `${String(e.num).padStart(2, "0")}  ${e.name} — ${e.summary}`;
    return e.status === "planned" ? `${line} (planned)` : line;
  });
}
