import { parse } from "yaml";
import { FORMAT_NAMES, isFormatName } from "./formats.js";
import type { FormatName, Headline, Item, Slide, SlideKind, SlidesFile } from "./types.js";

export const SLIDE_KINDS: readonly SlideKind[] = [
  "cover",
  "point",
  "list",
  "steps",
  "compare",
  "stat",
  "quote",
  "image",
  "cta",
  "custom",
];

/** A problem in slides.md; the message names the line. */
export class SlidesError extends Error {
  constructor(
    readonly line: number,
    problem: string,
  ) {
    super(`slides.md line ${line}: ${problem}`);
    this.name = "SlidesError";
  }
}

const SLIDE_START = /^##\s+(\S+)\s*(?:\{(.*)\})?\s*$/;
const MARKS: Record<string, Item["mark"]> = { "✓": "good", "✗": "bad" };

/** Parses a post's slides.md (format: docs/design/2026-11-19-posts-design.md, section 5.4). */
export function parseSlides(markdown: string): SlidesFile {
  const lines = markdown.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new SlidesError(1, "slides.md must start with front matter between --- lines (title, post_type)");
  }
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (close < 0) throw new SlidesError(1, "the front matter is not closed with a --- line");

  const front = lines.slice(1, close);
  const keyLine = (key: string) => {
    const at = front.findIndex((l) => l.startsWith(`${key}:`));
    return at < 0 ? 1 : at + 2;
  };
  let meta: Record<string, unknown>;
  try {
    meta = (parse(front.join("\n")) ?? {}) as Record<string, unknown>;
  } catch (error) {
    throw new SlidesError(1, `the front matter is not valid YAML (${(error as Error).message.split("\n")[0]})`);
  }

  if (typeof meta.title !== "string" || !meta.title.trim()) throw new SlidesError(1, "the front matter needs a title");
  if (!Number.isInteger(meta.post_type)) {
    throw new SlidesError(keyLine("post_type"), "the front matter needs post_type, the number of a post type");
  }

  const file: SlidesFile = {
    title: meta.title.trim(),
    postType: meta.post_type as number,
    formats: parseFormats(meta.format, keyLine("format")),
    slides: [],
  };
  if (meta.label !== undefined) file.label = String(meta.label);
  if (meta.style !== undefined) {
    if (!Number.isInteger(meta.style)) throw new SlidesError(keyLine("style"), "style must be the number of a style");
    file.style = meta.style as number;
  }
  if (meta.square !== undefined) {
    if (typeof meta.square !== "boolean") throw new SlidesError(keyLine("square"), "square must be true or false");
    file.square = meta.square;
  }

  let current: Slide | undefined;
  for (let i = close + 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const number = i + 1;
    if (line.startsWith("## ") || line === "##") {
      current = startSlide(line, number, file.slides.length);
      file.slides.push(current);
    } else if (current && line) {
      addLine(current, line, number);
    }
  }
  if (!file.slides.length) throw new SlidesError(close + 1, "no slides: start each one with ## and its kind");
  return file;
}

function parseFormats(value: unknown, line: number): FormatName[] {
  if (value === undefined || value === null) return [];
  const names = Array.isArray(value) ? value : [value];
  return names.map((name) => {
    if (typeof name !== "string" || !isFormatName(name)) {
      throw new SlidesError(line, `unknown format "${String(name)}"; the formats are: ${FORMAT_NAMES.join(", ")}`);
    }
    return name;
  });
}

function startSlide(line: string, number: number, index: number): Slide {
  const match = SLIDE_START.exec(line);
  const kind = match?.[1];
  if (!match || !kind || !SLIDE_KINDS.includes(kind as SlideKind)) {
    throw new SlidesError(number, `unknown slide kind "${kind ?? ""}"; the kinds are: ${SLIDE_KINDS.join(", ")}`);
  }
  return {
    index,
    kind: kind as SlideKind,
    attrs: parseAttrs(match[2], number),
    body: [],
    items: [],
    line: number,
  };
}

function parseAttrs(text: string | undefined, number: number): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const part of (text ?? "").split(",")) {
    if (!part.trim()) continue;
    const colon = part.indexOf(":");
    const key = part.slice(0, colon).trim();
    if (colon < 0 || !key) throw new SlidesError(number, `the attribute "${part.trim()}" must look like key: value`);
    attrs[key] = part.slice(colon + 1).trim();
  }
  return attrs;
}

function addLine(slide: Slide, line: string, number: number): void {
  if (line.startsWith("# ")) {
    if (slide.headline) throw new SlidesError(number, `slide ${slide.index + 1} (${slide.kind}) has two headlines`);
    slide.headline = parseHeadline(line.slice(2).trim(), number);
  } else if (line.startsWith("- ")) {
    slide.items.push(parseItem(line.slice(2).trim()));
  } else if (/^\[[^\]]+\]$/.test(line)) {
    slide.button = line.slice(1, -1).trim();
  } else {
    slide.body.push(line);
  }
}

function parseHeadline(source: string, number: number): Headline {
  const spans = [...source.matchAll(/\*([^*]+)\*/g)];
  if (spans.length > 1) throw new SlidesError(number, "a headline can have only one *accent* span");
  const stars = source.split("*").length - 1;
  if (stars !== (spans.length ? 2 : 0)) throw new SlidesError(number, "a * in the headline has no matching *");
  const span = spans[0];
  if (!span) return { text: source };
  const start = span.index!;
  return {
    text: source.slice(0, start) + span[1] + source.slice(start + span[0].length),
    accent: { start, end: start + span[1]!.length },
  };
}

function parseItem(source: string): Item {
  let text = source;
  const item: Item = { text };
  const mark = MARKS[text.charAt(0)];
  if (mark) {
    item.mark = mark;
    text = text.slice(1).trim();
  }
  const bar = text.indexOf(" | ");
  if (bar >= 0) {
    item.second = text.slice(bar + 3).trim();
    text = text.slice(0, bar).trim();
  }
  item.text = text;
  return item;
}
