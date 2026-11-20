import type { Rect } from "../../remotion/core/safeZone.js";

export type { Rect };

export type FormatName = "instagram-carousel" | "instagram-post" | "linkedin-carousel" | "story";

export interface PostFormat {
  name: FormatName;
  width: number;
  height: number;
  minSlides: number;
  maxSlides: number;
  /** Whether the post also gets a PDF. */
  pdf: boolean;
  /** Pixels kept clear of readable text on each side. */
  safe: { top: number; right: number; bottom: number; left: number };
  /** Where a cover's headline must stay (Instagram's profile grid crops to it). */
  coverArea?: Rect;
}

export type SlideKind = "cover" | "point" | "list" | "steps" | "compare" | "stat" | "quote" | "image" | "cta" | "custom";

export interface Headline {
  text: string;
  /** Indices into `text` (markers removed) of the accented words. */
  accent?: { start: number; end: number };
}

export interface Item {
  text: string;
  /** The smaller second line, from `a | b`. */
  second?: string;
  mark?: "good" | "bad";
}

export interface Slide {
  index: number;
  kind: SlideKind;
  attrs: Record<string, string>;
  headline?: Headline;
  body: string[];
  items: Item[];
  button?: string;
  /** 1-based line of the slide's `##` in the file, for errors. */
  line: number;
}

export interface SlidesFile {
  title: string;
  postType: number;
  /** The formats named in the front matter; empty when the page's formats apply. */
  formats: FormatName[];
  label?: string;
  style?: number;
  square?: boolean;
  slides: Slide[];
}
