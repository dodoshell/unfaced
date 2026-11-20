import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { formatFor, isFormatName } from "./formats.js";
import { parseSlides } from "./parseSlides.js";
import type { FormatName, PostFormat } from "./types.js";

/** A post folder is told by its slides.md. */
export const isPostDir = (dir: string): boolean => existsSync(join(dir, "slides.md"));

/** The `formats` in the page.yaml two folders above a post (`<page>/posts/<post>/`); empty when it names none. */
export function pageFormatsOf(postDir: string): FormatName[] {
  try {
    const data = parse(readFileSync(resolve(postDir, "..", "..", "page.yaml"), "utf8")) as { formats?: unknown } | null;
    return Array.isArray(data?.formats) ? data.formats.filter((f): f is FormatName => typeof f === "string" && isFormatName(f)) : [];
  } catch {
    return [];
  }
}

/**
 * The format a post's photos are sized to, or undefined when `dir` isn't a post: the first format
 * of slides.md, else the page's first, else instagram-carousel. `square: true` makes an
 * instagram-post 1080×1080.
 */
export function postFormatOf(dir: string, pageFormats: FormatName[] = pageFormatsOf(dir)): PostFormat | undefined {
  if (!isPostDir(dir)) return undefined;
  let slides: ReturnType<typeof parseSlides> | undefined;
  try {
    slides = parseSlides(readFileSync(join(dir, "slides.md"), "utf8"));
  } catch {
    // A slides.md with a problem is reported by `unfaced post`; photos still go by the page's formats.
  }
  const name = slides?.formats[0] ?? pageFormats[0] ?? "instagram-carousel";
  return formatFor(name, slides?.square === true);
}

/** The aspect ratio an image provider is asked for, from a size. */
export function aspectOf(size: { width: number; height: number }): "4:5" | "1:1" | "9:16" {
  const ratio = size.width / size.height;
  return Math.abs(ratio - 1) < 0.01 ? "1:1" : Math.abs(ratio - 4 / 5) < 0.01 ? "4:5" : "9:16";
}
