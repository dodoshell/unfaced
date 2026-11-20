import type { FormatName } from "../post/types.js";

export const CATALOG_KINDS = [
  "style",
  "script",
  "hook",
  "voice",
  "captions",
  "music",
  "ending",
  "duration",
  "post-type",
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

/** The page's brand for posts; every path is relative to the page folder. */
export interface Brand {
  handle?: string;
  site?: string;
  logo?: string;
  fonts?: Partial<Record<"display" | "accent" | "text" | "mono", string>>;
  tone?: string;
  words?: { use?: string[]; avoid?: string[] };
}

export interface Page {
  dir: string;
  name: string;
  language: string;
  niche: string;
  /** The catalog choices; `choices.style` is the video style (unset when only style.posts is given). */
  choices: Partial<Record<ChoiceField, Choice>>;
  postStyle?: Choice;
  /** True when style was written as { posts, ... }: the page asked for a post style of its own. */
  postsStyleSet?: boolean;
  postType?: Choice;
  formats?: FormatName[];
  brand?: Brand;
  duration?: { minSec: number; maxSec: number };
  palette?: string[];
  font?: string;
  mascot?: string;
  providers: Providers;
}
