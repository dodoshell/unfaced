// The sample post `unfaced demo <style> --post` renders: an invented studio's carousel with one
// slide of each kind the style draws, so every style is shown with the same words.
import type { FormatName, SlideKind } from "./types.js";

/** The sample's slides by kind, in the order the post shows them; a kind may have more than one. */
const SAMPLE: { kind: SlideKind; text: string }[] = [
  {
    kind: "cover",
    text: `## cover
# Your website should *work for you*
No templates, no guesswork. Here is how we build sites that bring in clients.`,
  },
  {
    kind: "point",
    text: `## point
# Speed is *a feature*
Every second a page takes to load costs you visitors. We build light sites that open fast on any phone, so people stay long enough to get in touch.`,
  },
  {
    kind: "point",
    text: `## point
# Made to be *found*
Clear pages, honest words and the details search engines read. Your clients find you before they find anyone else.`,
  },
];

export interface SampleOptions {
  /** The kinds the style draws; the sample keeps only those. */
  kinds: SlideKind[];
  formats: FormatName[];
  /** At most this many slides (1 for a single post). */
  count?: number;
}

/** The sample post's slides.md for `style`, by Studio Nord (an invented brand). */
export function sampleSlides(style: number, opts: SampleOptions): string {
  const slides = SAMPLE.filter((s) => opts.kinds.includes(s.kind)).slice(0, opts.count ?? SAMPLE.length);
  if (slides.length === 0) throw new Error(`The sample post has no slide of the kinds style ${style} draws (${opts.kinds.join(", ")})`);
  const front = ["---", "title: What we do", "post_type: 3", `format: [${opts.formats.join(", ")}]`, "label: About", `style: ${style}`, "---"];
  return `${[...front, "", slides.map((s) => s.text).join("\n\n")].join("\n")}\n`;
}
