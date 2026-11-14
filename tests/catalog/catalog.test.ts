import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_KINDS } from "../../engine/src/page/types.js";

const root = join(import.meta.dirname, "..", "..");
const catalog = Catalog.load(join(root, "catalog"));

// Launch entries, in order, from the design spec §5.4.
const launch: Record<string, string[]> = {
  style: ["Soft 3D", "90s low poly", "Flat cartoon", "Line art", "Ink silhouette", "Chalkboard", "Paper cut-out", "Vintage comic", "16-bit pixel art", "Neon synthwave", "Watercolour", "Kinetic typography"],
  script: ["Build it", "Top N countdown", "Myth or fact", "What if", "Story in 60 seconds", "Surprising answer", "How it works", "X vs Y", "Did you know", "Mini story"],
  hook: ["Shocking question", "Absurd number", "You're doing it wrong", "Impossible image", "Unfinished sentence", "Bold claim", "Countdown tease", "POV", "Nobody talks about this", "Before/after flash", "Insider secret", "Challenge", "Start at the climax", "Relatable pain", "Contrarian take"],
  voice: ["Calm documentary", "Energetic", "Storyteller", "Whisper", "Deadpan", "Warm friendly", "News anchor", "None (text only)"],
  captions: ["Word-by-word karaoke", "Bold centre", "Typewriter", "Minimal lower third", "Outline pop", "Highlight keyword"],
  music: ["Suspense", "Epic", "Lo-fi", "Upbeat", "Playful", "Emotional", "Mystery", "None"],
  ending: ["Seamless loop", "Cliffhanger", "Comment question", "Follow for part 2", "Punchline", "Callback to the hook"],
  duration: ["15 seconds", "30 seconds", "45 seconds", "60 seconds"],
};

const ready = new Set(["style:3", "script:6", "script:9", "captions:1", "duration:1", "duration:2", "duration:3", "duration:4", "music:8", "ending:5"]);

describe("catalog", () => {
  it("numbers every kind from 1 with no gaps or duplicates", () => {
    for (const kind of CATALOG_KINDS) {
      const ids = catalog.ids(kind);
      expect(ids, kind).toEqual(Array.from({ length: ids.length }, (_, i) => i + 1));
    }
  });

  it("lists exactly the launch entries of the spec, in order", () => {
    for (const kind of CATALOG_KINDS) {
      expect(catalog.list(kind).map((e) => e.name), kind).toEqual(launch[kind]);
    }
  });

  it("marks only the Phase 1 entries as ready", () => {
    const readyNow = CATALOG_KINDS.flatMap((k) => catalog.list(k)).filter((e) => e.status === "ready").map((e) => `${e.kind}:${e.num}`);
    expect(new Set(readyNow)).toEqual(ready);
  });

  it("points every ready entry at a file that exists", () => {
    for (const kind of CATALOG_KINDS) {
      for (const entry of catalog.list(kind).filter((e) => e.status === "ready")) {
        expect(existsSync(join(catalog.root, entry.path.split("#")[0]!)), `${kind} ${entry.num}: ${entry.path}`).toBe(true);
      }
    }
  });

  it("throws a helpful error for an unknown entry", () => {
    expect(() => catalog.get("style", 40)).toThrow(/style 40.*1–12/);
  });
});

describe("unfaced list", () => {
  it("prints one numbered line per style, planned ones marked", () => {
    const out = execFileSync(process.execPath, ["--import", "tsx", join(root, "engine/src/cli.ts"), "list", "style"], { cwd: root, encoding: "utf8" });
    const lines = out.trim().split(/\r?\n/);
    expect(lines).toHaveLength(12);
    expect(lines[2]).toMatch(/^03 {2}Flat cartoon — /);
    expect(lines[2]).not.toContain("(planned)");
    expect(lines[0]).toContain("(planned)");
  });
});
