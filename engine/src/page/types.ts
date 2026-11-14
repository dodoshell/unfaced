export const CATALOG_KINDS = [
  "style",
  "script",
  "hook",
  "voice",
  "captions",
  "music",
  "ending",
  "duration",
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

/** A fixed number, a list the agent picks from, or "auto". */
export type Choice = number | number[] | "auto";

/** The catalog fields a page profile can set (duration is a seconds range instead). */
export const CHOICE_FIELDS = ["style", "script", "hook", "voice", "captions", "music", "ending"] as const;
export type ChoiceField = (typeof CHOICE_FIELDS)[number];

export interface CatalogLike {
  ids(kind: CatalogKind): number[];
}

export interface Providers {
  voice: string;
  ai_clips: string;
  images: string;
}

export interface Page {
  dir: string;
  name: string;
  language: string;
  niche: string;
  choices: Partial<Record<ChoiceField, Choice>>;
  duration?: { minSec: number; maxSec: number };
  palette?: string[];
  font?: string;
  mascot?: string;
  providers: Providers;
}
