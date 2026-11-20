import type { FormatName, PostFormat } from "./types.js";

const GRID_SAFE = { top: 60, right: 60, bottom: 60, left: 60 } as const;

export const FORMATS: Record<FormatName, PostFormat> = {
  "instagram-carousel": {
    name: "instagram-carousel",
    width: 1080,
    height: 1350,
    minSlides: 2,
    maxSlides: 10,
    pdf: false,
    safe: { ...GRID_SAFE },
    coverArea: { x: 0, y: 169, w: 1080, h: 1012 },
  },
  "instagram-post": {
    name: "instagram-post",
    width: 1080,
    height: 1350,
    minSlides: 1,
    maxSlides: 1,
    pdf: false,
    safe: { ...GRID_SAFE },
    coverArea: { x: 0, y: 169, w: 1080, h: 1012 },
  },
  "linkedin-carousel": {
    name: "linkedin-carousel",
    width: 1080,
    height: 1350,
    minSlides: 2,
    maxSlides: 12,
    pdf: true,
    safe: { ...GRID_SAFE },
    coverArea: { x: 0, y: 169, w: 1080, h: 1012 },
  },
  story: {
    name: "story",
    width: 1080,
    height: 1920,
    minSlides: 1,
    maxSlides: 10,
    pdf: false,
    safe: { top: 250, right: 60, bottom: 340, left: 60 },
  },
};

export const FORMAT_NAMES = Object.keys(FORMATS) as FormatName[];

/** Plain words the skill may meet, for docs and the skill only; the engine takes real names. */
export const FORMAT_ALIASES: Record<string, FormatName> = {
  carousel: "instagram-carousel",
  linkedin: "linkedin-carousel",
  post: "instagram-post",
  single: "instagram-post",
  story: "story",
  stories: "story",
};

export function isFormatName(name: string): name is FormatName {
  return Object.prototype.hasOwnProperty.call(FORMATS, name);
}

/** The format called `name`; `square` makes an instagram-post 1080×1080. */
export function formatFor(name: string, square = false): PostFormat {
  if (!isFormatName(name)) {
    throw new Error(`Unknown post format "${name}". The formats are: ${FORMAT_NAMES.join(", ")}.`);
  }
  const format = FORMATS[name];
  if (square && name === "instagram-post") {
    const { coverArea: _crop, ...rest } = format;
    return { ...rest, height: 1080, safe: { ...format.safe } };
  }
  return format;
}
