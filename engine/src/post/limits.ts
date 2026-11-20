// How much text each slide kind takes (docs/formats/slides.md, Kinds). Every style is built and
// tested to fit these at their longest, so a slide past them is refused before it is laid out.
import type { Item, Slide } from "./types.js";

export const LIMITS = {
  coverWords: 12,
  /** Items drawn as chips around a cover's phone (`{visual: chips}`), and their words. */
  coverChips: 4,
  chipWords: 3,
  /** The text on a cover's phone (`{visual: phone, screen: "…"}`) and a notification's title and text. */
  screenWords: 8,
  notificationTitleWords: 6,
  notificationTextWords: 14,
  pointWords: 45,
  listItems: 5,
  listWords: 8,
  steps: { min: 2, max: 6 },
  stepWords: 3,
  comparePerSide: 4,
  compareWords: 6,
  statCharacters: 8,
  quoteWords: 35,
} as const;

const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What is past the limits on `slide`, as a sentence that says what to change; undefined when it is within them. */
export function slideLimit(slide: Slide): string | undefined {
  const { headline, body, items } = slide;
  switch (slide.kind) {
    case "cover": {
      const n = headline ? words(headline.text) : 0;
      if (n > LIMITS.coverWords) return `a cover headline takes up to ${LIMITS.coverWords} words; this one has ${n}`;
      const { visual, screen, title, text } = slide.attrs;
      if (visual === "chips") return itemLimit(items, LIMITS.coverChips, LIMITS.chipWords, "a cover's chips", "chip");
      if (visual === "phone" && screen && words(screen) > LIMITS.screenWords) return `the phone's screen takes up to ${LIMITS.screenWords} words; this one has ${words(screen)}`;
      if (visual === "notification") {
        if (!title && !text) return `a notification needs a title or a text: ## cover {visual: notification, title: "New booking", text: "Anna, Friday at 10:00"}`;
        if (title && words(title) > LIMITS.notificationTitleWords) return `a notification's title takes up to ${LIMITS.notificationTitleWords} words; this one has ${words(title)}`;
        if (text && words(text) > LIMITS.notificationTextWords) return `a notification's text takes up to ${LIMITS.notificationTextWords} words; this one has ${words(text)}`;
      }
      if (visual !== undefined && !["chips", "phone", "notification"].includes(visual)) return `a cover's visual is chips, phone or notification, not "${visual}"`;
      return undefined;
    }
    case "point": {
      const n = words(body.join(" "));
      return n > LIMITS.pointWords ? `a point's body takes up to ${LIMITS.pointWords} words; this one has ${n}` : undefined;
    }
    case "list":
      return itemLimit(items, LIMITS.listItems, LIMITS.listWords, "a list", "item");
    case "steps": {
      const { min, max } = LIMITS.steps;
      if (items.length < min || items.length > max) return `a steps slide takes ${min} to ${max} steps (- lines); this one has ${items.length}`;
      return itemLimit(items, max, LIMITS.stepWords, "a steps slide", "step", " (put the rest in its second line: - Step | who)");
    }
    case "compare": {
      const marked = items.some((i) => i.mark);
      const sides = marked
        ? [
            { name: "✗ side", n: items.filter((i) => i.mark === "bad").length },
            { name: "✓ side", n: items.filter((i) => i.mark !== "bad").length },
          ]
        : [{ name: "before side", n: Math.ceil(items.length / 2) }];
      for (const side of sides) {
        if (side.n > LIMITS.comparePerSide) return `a compare slide takes up to ${LIMITS.comparePerSide} items per side; the ${side.name} has ${side.n}`;
      }
      return itemLimit(items, Infinity, LIMITS.compareWords, "a compare slide", "item");
    }
    case "stat": {
      const figure = headline?.text ?? "";
      const n = [...figure].length;
      if (!figure) return `a stat slide needs its figure as the headline: # +40%`;
      return n > LIMITS.statCharacters ? `a stat's figure takes up to ${LIMITS.statCharacters} characters; "${figure}" has ${n}` : undefined;
    }
    case "quote": {
      const n = headline ? words(headline.text) : 0;
      if (!headline) return `a quote slide needs the quote as its headline: # "…", with the author on the line under it`;
      return n > LIMITS.quoteWords ? `a quote takes up to ${LIMITS.quoteWords} words; this one has ${n}` : undefined;
    }
    case "image":
      if (!slide.attrs.photo) return "an image slide needs a photo from the post's inbox/: ## image {photo: inbox/shop.jpg}";
      if (!headline && !body.length) return "an image slide needs a headline or a caption";
      return undefined;
    case "cta":
      return slide.button ? undefined : "a cta slide needs its button: [the button's text] on a line of its own";
    default:
      return undefined;
  }
}

function itemLimit(items: Item[], max: number, maxWords: number, what: string, item: string, hint = ""): string | undefined {
  if (items.length > max) return `${what} takes up to ${plural(max, item)}; this one has ${items.length}`;
  const long = items.findIndex((i) => words(i.text) > maxWords);
  if (long >= 0) return `${item} ${long + 1} ("${items[long]!.text}") has ${words(items[long]!.text)} words; ${what} takes up to ${maxWords} per ${item}${hint}`;
  return undefined;
}
