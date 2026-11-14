import { parse } from "yaml";

export interface Beat {
  id: string;
  kind: "hook" | "body" | "ending";
  /** What the narrator says, exactly as written (emoji included). */
  text: string;
  /** What should be on screen, from a `> visual:` line. */
  visual?: string;
}

export interface Script {
  title: string;
  scriptType: number;
  hook: number;
  ending: number;
  /** Where the facts come from, from the optional `sources` field. */
  sources: string[];
  beats: Beat[];
  /** Every beat's text in order, without emoji: what the voice reads. */
  spokenText: string;
}

const VISUAL = /^>\s*visual:\s*(.*)$/i;
const LIST_ITEM = /^-\s+/;
const EMOJI =/[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️]/gu;

/** Parses a video's script.md (format: docs/formats/script.md). */
export function parseScript(markdown: string): Script {
  const text = markdown.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error("script.md must start with front matter between --- lines (title, script_type, hook, ending)");
  const meta = (parse(match[1]!) ?? {}) as Record<string, unknown>;

  const sections = splitSections(match[2]!);
  const section = (name: string) => {
    const paragraphs = sections.get(name.toLowerCase());
    if (!paragraphs?.length) throw new Error(`script.md needs a ## ${name} section`);
    return paragraphs;
  };
  const hook = section("Hook");
  const body = section("Body");
  const ending = section("Ending");

  const beats: Beat[] = [
    merge("hook", "hook", hook),
    ...body.map((p, i) => ({ id: `b${i + 1}`, kind: "body" as const, text: p.text, ...(p.visual ? { visual: p.visual } : {}) })),
    merge("ending", "ending", ending),
  ];

  return {
    title: field(meta, "title", "string"),
    scriptType: field(meta, "script_type", "number"),
    hook: field(meta, "hook", "number"),
    ending: field(meta, "ending", "number"),
    sources: meta.sources === undefined ? [] : ([] as unknown[]).concat(meta.sources).map(String),
    beats,
    spokenText: beats.map((b) => speakable(b.text)).filter(Boolean).join(" "),
  };
}

interface Paragraph {
  text: string;
  visual?: string;
}

/** Sections by lower-cased `##` heading; each a list of paragraphs with their visuals. */
function splitSections(body: string): Map<string, Paragraph[]> {
  const sections = new Map<string, Paragraph[]>();
  let current: Paragraph[] | undefined;
  let lines: string[] = [];
  const flush = () => {
    if (!current || lines.length === 0) return;
    const spoken = lines.filter((l) => !VISUAL.test(l));
    const visual = lines.map((l) => VISUAL.exec(l)?.[1]?.trim()).find((v) => v !== undefined);
    const previous = current.at(-1);
    if (spoken.length === 0 && visual !== undefined && previous && previous.visual === undefined) {
      previous.visual = visual; // a visual written as its own paragraph belongs to the one before
    } else if (spoken.length > 0) {
      // List items ("- water") keep their own lines; other lines of a paragraph are joined.
      const text = spoken.some((l) => LIST_ITEM.test(l)) ? spoken.join("\n") : spoken.join(" ");
      current.push({ text, ...(visual !== undefined ? { visual } : {}) });
    }
    lines = [];
  };

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      current = [];
      sections.set(heading[1]!.toLowerCase(), current);
    } else if (line === "") {
      flush();
    } else {
      lines.push(line);
    }
  }
  flush();
  return sections;
}

function merge(id: string, kind: Beat["kind"], paragraphs: Paragraph[]): Beat {
  const visual = paragraphs.find((p) => p.visual !== undefined)?.visual;
  return { id, kind, text: paragraphs.map((p) => p.text).join(" "), ...(visual !== undefined ? { visual } : {}) };
}

/** What the voice reads: list items become "a, b, c.", emoji are dropped. */
function speakable(text: string): string {
  const lines = text.split("\n");
  const items = lines.filter((l) => LIST_ITEM.test(l)).map((l) => l.replace(LIST_ITEM, "").replace(/[.,;]+$/, ""));
  const read = items.length ? [...lines.filter((l) => !LIST_ITEM.test(l)), `${items.join(", ")}.`].join(" ") : text;
  return read
    .replace(EMOJI, "")
    .replace(/\s+([!?.,;:…])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function field(meta: Record<string, unknown>, name: string, type: "string"): string;
function field(meta: Record<string, unknown>, name: string, type: "number"): number;
function field(meta: Record<string, unknown>, name: string, type: "string" | "number"): string | number {
  const value = meta[name];
  if (value === undefined) throw new Error(`script.md front matter needs "${name}"`);
  if (type === "number" && !(Number.isInteger(value) && (value as number) >= 1)) {
    throw new Error(`script.md front matter: "${name}" must be a catalog number, got ${JSON.stringify(value)}`);
  }
  if (type === "string" && (typeof value !== "string" || value.trim() === "")) {
    throw new Error(`script.md front matter: "${name}" must be text`);
  }
  return value as string | number;
}
