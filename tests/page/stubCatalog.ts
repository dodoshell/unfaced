import type { CatalogKind, CatalogLike } from "../../engine/src/page/types.js";

const sizes: Record<CatalogKind, number> = {
  style: 12,
  script: 10,
  hook: 15,
  voice: 8,
  captions: 6,
  music: 8,
  ending: 6,
  duration: 4,
  "post-type": 6,
};

export const stubCatalog: CatalogLike = {
  ids: (kind) => Array.from({ length: sizes[kind] }, (_, i) => i + 1),
};
