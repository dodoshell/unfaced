import type { CatalogKind, CatalogLike, Choice } from "./types.js";

/**
 * Turns a page's choice for one catalog into a single entry number.
 * A list or "auto" (or a missing field) is narrowed by `pick`, which the caller
 * implements (usually the agent's recommendation).
 */
export function resolveChoice(
  kind: CatalogKind,
  choice: Choice | undefined,
  catalog: CatalogLike,
  pick: (options: number[]) => number,
): number {
  if (typeof choice === "number") return choice;
  const options = Array.isArray(choice) ? choice : catalog.ids(kind);
  const picked = pick(options);
  if (!options.includes(picked)) {
    throw new Error(`${kind} ${picked} is not one of the allowed options: ${options.join(", ")}`);
  }
  return picked;
}
