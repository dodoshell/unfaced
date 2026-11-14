import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Catalog } from "../catalog/catalog.js";
import { NO_MUSIC } from "../catalog/special.js";
import { CHOICE_FIELDS, type ChoiceField } from "../page/types.js";
import type { VideoPlan } from "../plan/types.js";
import { VIDEO_CHOICES } from "../script/parseScript.js";

/** One row of results.md: one video on one platform (format: docs/formats/results.md). */
export interface ResultRow {
  /** The row's place in the table, counting from 1 below the header. */
  row: number;
  video: string;
  platform: string;
  posted?: string;
  views?: number;
  /** Average watched, as written: a share of the video or seconds. */
  watched?: { share: number } | { sec: number };
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  follows?: number;
  notes?: string;
}

const COUNTS = ["views", "likes", "comments", "shares", "saves", "follows"] as const;
const COLUMN: Record<string, keyof Omit<ResultRow, "row">> = {
  video: "video",
  platform: "platform",
  posted: "posted",
  views: "views",
  "avg watched": "watched",
  likes: "likes",
  comments: "comments",
  shares: "shares",
  saves: "saves",
  follows: "follows",
  notes: "notes",
  // What the platforms' insights call them, for numbers pasted as they are.
  date: "posted",
  plays: "views",
  "video views": "views",
  "avg watch time": "watched",
  "average watch time": "watched",
  "average watched": "watched",
  "average view duration": "watched",
  followers: "follows",
  "new followers": "follows",
};

/** A column name as COLUMN keys it: lower case, without dots, single spaces. */
const columnKey = (name: string) => name.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

/** A count, plain (12400) or shortened the way the apps show it (12.4K, 1,2M). */
function count(value: string): number | undefined {
  if (/^\d+$/.test(value)) return Number(value);
  const short = /^(\d+(?:[.,]\d+)?)\s*([km])$/i.exec(value);
  return short ? Math.round(Number(short[1]!.replace(",", ".")) * (short[2]!.toLowerCase() === "k" ? 1e3 : 1e6)) : undefined;
}

const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const title = (key: string) => key[0]!.toUpperCase() + key.slice(1);

/** The rows of the first table in results.md with Video and Platform columns, and every cell it can't read. */
export function parseResults(markdown: string): { rows: ResultRow[]; problems: string[] } {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const start = lines.findIndex((line, i) => {
    const names = cells(line).map((c) => c.toLowerCase());
    return line.trim().startsWith("|") && names.includes("video") && names.includes("platform") && /^\s*\|?\s*:?-/.test(lines[i + 1] ?? "");
  });
  if (start < 0) return { rows: [], problems: ["results.md has no table with Video and Platform columns (format: unfaced docs results)"] };

  const header = cells(lines[start]!).map((c) => COLUMN[columnKey(c)]);
  const rows: ResultRow[] = [];
  const problems: string[] = [];
  for (let i = start + 2; i < lines.length && lines[i]!.trim().startsWith("|"); i++) {
    const row: ResultRow = { row: rows.length + 1, video: "", platform: "" };
    const bad = (column: string, message: string) => problems.push(`row ${row.row}: ${column} ${message}`);
    cells(lines[i]!).forEach((value, c) => {
      const key = header[c];
      if (!key || value === "") return;
      if (key === "video" || key === "platform" || key === "notes") row[key] = value;
      else if (key === "posted") {
        if (/^\d{4}-\d{2}-\d{2}( \d{1,2}:\d{2})?$/.test(value)) row.posted = value;
        else bad("Posted", `"${value}" is not a date; write ${isoGuess(value) ?? "2026-11-14"}`);
      } else if (key === "watched") {
        const share = /^(\d+(?:\.\d+)?)\s*%$/.exec(value);
        const sec = /^(\d+(?:\.\d+)?)\s*s$/i.exec(value);
        const clock = /^(\d+):([0-5]\d)$/.exec(value);
        if (share) row.watched = { share: Number(share[1]) / 100 };
        else if (sec) row.watched = { sec: Number(sec[1]) };
        else if (clock) row.watched = { sec: Number(clock[1]) * 60 + Number(clock[2]) };
        else bad("Avg watched", `"${value}" needs a unit: a share (71%) or seconds (9.8s)`);
      } else {
        const n = count(value);
        if (n !== undefined) row[key] = n;
        else bad(title(key), `"${value}" is not a number${/^\d{1,3}([,. ']\d{3})+$/.test(value) ? `; write it without separators (${value.replace(/\D/g, "")})` : ""}`);
      }
    });
    const same = rows.find((r) => r.video === row.video && r.platform.toLowerCase() === row.platform.toLowerCase());
    if (same) problems.push(`row ${row.row}: ${row.video} on ${same.platform} already has row ${same.row}; update that row instead`);
    rows.push(row);
  }
  return { rows, problems };
}

/** A day-first date written with slashes or dots, as YYYY-MM-DD. */
function isoGuess(value: string): string | undefined {
  const m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(value);
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : undefined;
}

/** What a video was made with: its length and its catalog choices. */
export interface VideoFacts {
  lengthSec?: number;
  choices: Partial<Record<ChoiceField, number>>;
}

/**
 * A video's facts from its folder: plan.json says what it was made with; script.md adds the
 * hook (and stands in for the plan before the video is made).
 */
export function readVideoFacts(videoDir: string): VideoFacts {
  const facts: VideoFacts = { choices: {} };
  const scriptFile = join(videoDir, "script.md");
  if (existsSync(scriptFile)) {
    const front = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(scriptFile, "utf8"));
    const meta = ((front && parse(front[1]!)) ?? {}) as Record<string, unknown>;
    const set = (field: ChoiceField, value: unknown) => {
      if (Number.isInteger(value)) facts.choices[field] = value as number;
    };
    for (const field of VIDEO_CHOICES) set(field, meta[field]);
    set("script", meta.script_type);
    set("hook", meta.hook);
    set("ending", meta.ending);
  }
  const planFile = join(videoDir, "plan.json");
  if (existsSync(planFile)) {
    const plan = JSON.parse(readFileSync(planFile, "utf8")) as VideoPlan;
    facts.lengthSec = plan.durationInFrames / plan.fps;
    Object.assign(facts.choices, {
      style: plan.style,
      captions: plan.captions,
      ...(plan.voice !== undefined ? { voice: plan.voice } : {}),
      music: plan.music ?? NO_MUSIC,
      ...(plan.scriptType !== undefined ? { script: plan.scriptType } : {}),
      ...(plan.ending !== undefined ? { ending: plan.ending } : {}),
    });
  }
  return facts;
}

const pad = (n: number) => String(n).padStart(2, "0");
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const percent = (x: number) => `${(x * 100).toFixed(x >= 0.01 ? 1 : 2)}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

/** "01 Shocking question", or the bare number when the catalog doesn't have it. */
function entryName(catalog: Catalog, kind: ChoiceField | "duration", num: number): string {
  try {
    return `${pad(num)} ${catalog.get(kind, num).name}`;
  } catch {
    return pad(num);
  }
}

/** The duration preset nearest to a video's real length. */
function lengthBucket(catalog: Catalog, sec: number): number {
  const presets = catalog.list("duration").map((e) => ({ num: e.num, sec: Number(/^\d+/.exec(e.name)?.[0]) }));
  return presets.reduce((best, p) => (Math.abs(p.sec - sec) < Math.abs(best.sec - sec) ? p : best)).num;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Numbers recorded earlier than this after posting still move a lot. */
const SETTLED_DAYS = 7;

/**
 * The report `unfaced results` prints: per platform, the videos ranked by average watched with
 * their rates per view, the median watched of each choice that varies, then what to check.
 */
export function compareResults(rows: ResultRow[], facts: Map<string, VideoFacts>, catalog: Catalog, today: Date, problems: string[] = []): string[] {
  const out: string[] = [];
  const platforms = new Map<string, ResultRow[]>();
  for (const row of rows) {
    const key = row.platform.toLowerCase();
    platforms.set(key, [...(platforms.get(key) ?? []), row]);
  }

  for (const platformRows of platforms.values()) {
    const scored = platformRows.map((row) => {
      const length = facts.get(row.video)?.lengthSec;
      const share = !row.watched ? undefined : "share" in row.watched ? row.watched.share : length ? row.watched.sec / length : undefined;
      return { row, share, length };
    });
    scored.sort((a, b) => (b.share ?? -1) - (a.share ?? -1) || (b.row.views ?? 0) - (a.row.views ?? 0));

    out.push(`## ${platformRows[0]!.platform}`, "");
    out.push("| Rank | Video | Avg watched | Views | Shares + saves per view | Follows per view | Comments per view | Length |", "|---|---|---|---|---|---|---|---|");
    scored.forEach(({ row, share, length }, i) => {
      const perView = (...counts: (number | undefined)[]) => {
        const known = counts.filter((c): c is number => c !== undefined);
        return row.views && known.length ? percent(known.reduce((a, b) => a + b, 0) / row.views) : "—";
      };
      const watched = share !== undefined ? `${Math.round(share * 100)}%` : row.watched ? `${(row.watched as { sec: number }).sec}s` : "—";
      out.push(`| ${i + 1} | ${row.video} | ${watched} | ${row.views ?? "—"} | ${perView(row.shares, row.saves)} | ${perView(row.follows)} | ${perView(row.comments)} | ${length !== undefined ? `${Math.round(length)} s` : "—"} |`);
    });
    out.push("");

    const measured = scored.filter((s) => s.share !== undefined);
    if (measured.length < 2) {
      out.push(measured.length ? "One video with average watched so far: nothing to compare yet." : "No average watched yet: nothing to compare.", "");
      continue;
    }
    out.push("Average watched by choice (median of the videos with each choice):");
    const same: string[] = [];
    const fields: (ChoiceField | "length")[] = [...CHOICE_FIELDS, "length"];
    for (const field of fields) {
      const groups = new Map<number, number[]>();
      for (const s of measured) {
        const f = facts.get(s.row.video);
        const value = field === "length" ? (f?.lengthSec !== undefined ? lengthBucket(catalog, f.lengthSec) : undefined) : f?.choices[field];
        if (value !== undefined) groups.set(value, [...(groups.get(value) ?? []), s.share!]);
      }
      const kind = field === "length" ? "duration" : field;
      if (groups.size === 1 && [...groups.values()][0]!.length === measured.length) same.push(`${field} ${entryName(catalog, kind, [...groups.keys()][0]!)}`);
      if (groups.size < 2) continue;
      const ranked = [...groups].map(([value, shares]) => ({ value, n: shares.length, mid: median(shares) })).sort((a, b) => b.mid - a.mid);
      out.push(`- ${field}: ${ranked.map((g) => `${entryName(catalog, kind, g.value)} ${Math.round(g.mid * 100)}% (${plural(g.n, "video")}${g.n < 3 ? ", thin" : ""})`).join(" · ")}`);
    }
    if (same.length) out.push(`Same in every video, so they explain nothing: ${same.join(", ")}.`);
    out.push("");
  }

  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const early = rows.flatMap((row) => {
    if (!row.posted) return [];
    const days = Math.round((midnight(today) - midnight(new Date(`${row.posted.slice(0, 10)}T00:00`))) / DAY_MS);
    if (days < 0) return [`- ${row.video} on ${row.platform}: Posted ${row.posted} is in the future.`];
    return days < SETTLED_DAYS ? [`- ${row.video} on ${row.platform} was posted ${days === 0 ? "today" : `${plural(days, "day")} ago`}: numbers move a lot in the first week.`] : [];
  });
  out.push("## Check", "", ...(problems.length || early.length ? [...problems.map((p) => `- ${p}`), ...early] : ["- Nothing to fix."]));
  return out;
}
