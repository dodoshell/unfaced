import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATALOG_KINDS, type CatalogKind, type CatalogLike } from "../page/types.js";

export interface CatalogEntry {
  kind: CatalogKind;
  num: number;
  slug: string;
  name: string;
  summary: string;
  goodFor: string[];
  /** Relative to the catalog folder; an anchor (#...) points at a section of a shared file. */
  path: string;
  /** Whether videos can be made with it. */
  status: "ready" | "planned";
  /** Whether posts can be made with it; an entry without the field (styles 1–12) makes none. */
  posts?: "ready" | "planned";
}

export class Catalog implements CatalogLike {
  private constructor(
    /** The catalog folder; entry paths are relative to it. */
    readonly root: string,
    private readonly entries: Record<CatalogKind, CatalogEntry[]>,
  ) {}

  static load(root: string): Catalog {
    const raw = JSON.parse(readFileSync(join(root, "catalog.json"), "utf8")) as Record<string, unknown>;
    const entries = {} as Record<CatalogKind, CatalogEntry[]>;
    for (const kind of CATALOG_KINDS) {
      const list = raw[kind];
      if (!Array.isArray(list)) throw new Error(`catalog.json has no "${kind}" list`);
      entries[kind] = (list as Omit<CatalogEntry, "kind">[]).map((e) => ({ ...e, kind })).sort((a, b) => a.num - b.num);
    }
    return new Catalog(root, entries);
  }

  ids(kind: CatalogKind): number[] {
    return this.entries[kind].map((e) => e.num);
  }

  get(kind: CatalogKind, num: number): CatalogEntry {
    const entry = this.entries[kind].find((e) => e.num === num);
    if (!entry) {
      const ids = this.ids(kind);
      throw new Error(`${kind} ${num} does not exist; choose a number from ${ids[0]}–${ids[ids.length - 1]}`);
    }
    return entry;
  }

  list(kind: CatalogKind): CatalogEntry[] {
    return [...this.entries[kind]];
  }
}
