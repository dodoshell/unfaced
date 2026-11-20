import { Catalog } from "../catalog/catalog.js";
import { CATALOG_KINDS, type CatalogKind } from "../page/types.js";

/** Lines for `unfaced list <kind>`: `NN  Name — summary`, with `(planned)` after entries not built yet. */
export function listLines(catalog: Catalog, kind: string): string[] {
  if (!(CATALOG_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Unknown catalog "${kind}". Choose one of: ${CATALOG_KINDS.join(", ")}`);
  }
  return catalog.list(kind as CatalogKind).map((e) => {
    const line = `${String(e.num).padStart(2, "0")}  ${e.name} — ${e.summary}`;
    if (e.kind === "style") {
      // What the style makes: videos (status) and posts (an entry without the field makes none).
      const makes = [e.status === "ready" && "videos", e.posts === "ready" && "posts"].filter(Boolean);
      return `${line} (${makes.length ? makes.join(", ") : "planned"})`;
    }
    return e.status === "planned" ? `${line} (planned)` : line;
  });
}
