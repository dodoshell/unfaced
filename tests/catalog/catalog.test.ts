import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CAPTION_STYLES } from "../../engine/remotion/core/captionLayout.js";
import { getLayout } from "../../engine/remotion/styles/layouts.js";
import { CATALOG_KINDS } from "../../engine/src/page/types.js";
import { MOODS } from "../../engine/src/music/moods.js";
import { kokoroVoice } from "../../engine/src/voice/kokoro.js";

const root = join(import.meta.dirname, "..", "..");
const catalog = Catalog.load(join(root, "catalog"));

// Launch entries, in order, from the design spec §5.4.
const launch: Record<string, string[]> = {
  style: ["Soft 3D", "90s low poly", "Flat cartoon", "Line art", "Ink silhouette", "Chalkboard", "Paper cut-out", "Vintage comic", "16-bit pixel art", "Neon synthwave", "Watercolour", "Kinetic typography", "Night tech"],
  script: ["Build it", "Top N countdown", "Myth or fact", "What if", "Story in 60 seconds", "Surprising answer", "How it works", "X vs Y", "Did you know", "Mini story"],
  hook: ["Shocking question", "Absurd number", "You're doing it wrong", "Impossible image", "Unfinished sentence", "Bold claim", "Countdown tease", "POV", "Nobody talks about this", "Before/after flash", "Insider secret", "Challenge", "Start at the climax", "Relatable pain", "Contrarian take"],
  voice: ["Calm documentary", "Energetic", "Storyteller", "Whisper", "Deadpan", "Warm friendly", "News anchor", "None (text only)"],
  captions: ["Word-by-word karaoke", "Bold centre", "Typewriter", "Minimal lower third", "Outline pop", "Highlight keyword"],
  music: ["Suspense", "Epic", "Lo-fi", "Upbeat", "Playful", "Emotional", "Mystery", "None"],
  ending: ["Seamless loop", "Cliffhanger", "Comment question", "Follow for part 2", "Punchline", "Callback to the hook"],
  duration: ["15 seconds", "30 seconds", "45 seconds", "60 seconds"],
  "post-type": ["Tips and mistakes", "How it works", "About us", "Services and prices", "Before and after", "Announcement"],
};


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

  it("backs every ready entry with what makes it work", () => {
    const readyOf = (kind: (typeof CATALOG_KINDS)[number]) => catalog.list(kind).filter((e) => e.status === "ready");
    for (const e of readyOf("style")) expect(() => getLayout(e.num), `style ${e.num}`).not.toThrow();
    for (const e of readyOf("captions")) expect(CAPTION_STYLES[e.num], `captions ${e.num}`).toBeDefined();
    for (const e of readyOf("voice")) if (e.num !== 8) expect(() => kokoroVoice("en", e.num), `voice ${e.num}`).not.toThrow();
    for (const e of readyOf("music")) if (e.num !== 8) expect(MOODS, `music ${e.num}`).toContain(e.num);
  });

  it("documents every entry that lives in a shared file under its own heading", () => {
    for (const kind of CATALOG_KINDS) {
      for (const entry of catalog.list(kind)) {
        const [file, anchor] = entry.path.split("#");
        if (!anchor) continue;
        const text = readFileSync(join(catalog.root, file!), "utf8");
        const num = String(entry.num).padStart(2, "0");
        expect(text, `${kind} ${entry.num} in ${file}`).toMatch(new RegExp(`^## ${num} `, "m"));
        if (entry.status === "ready") expect(text.split(new RegExp(`^## ${num} `, "m"))[1]!.split(/^## /m)[0], `${kind} ${entry.num}`).toContain("**Status:** ready");
      }
    }
  });

  it("points every ready entry at a file that exists", () => {
    for (const kind of CATALOG_KINDS) {
      for (const entry of catalog.list(kind).filter((e) => e.status === "ready")) {
        expect(existsSync(join(catalog.root, entry.path.split("#")[0]!)), `${kind} ${entry.num}: ${entry.path}`).toBe(true);
      }
    }
  });

  it("throws a helpful error for an unknown entry", () => {
    expect(() => catalog.get("style", 40)).toThrow(/style 40.*1–13/);
  });
});

describe("unfaced list", () => {
  it("prints one numbered line per style, planned ones marked", () => {
    const out = execFileSync(process.execPath, ["--import", "tsx", join(root, "engine/src/cli.ts"), "list", "style"], { cwd: root, encoding: "utf8" });
    const lines = out.trim().split(/\r?\n/);
    expect(lines).toHaveLength(13);
    expect(lines[2]).toMatch(/^03 {2}Flat cartoon — /);
    const styles = catalog.list("style");
    styles.forEach((entry, i) => expect(lines[i]!.includes("(planned)"), lines[i]).toBe(entry.status === "planned"));
  });
});

describe("examples/hooks", () => {
  /** Each hook's examples, keyed by its "## NN Name" heading, as `Niche: "line"`; `indent` is the examples' list indent. */
  const examples = (text: string, indent: string) => {
    const byHook = new Map<string, string[]>();
    let hook = "";
    for (const line of text.split(/\r?\n/)) {
      const heading = /^## (\d\d .+)$/.exec(line);
      if (heading) byHook.set((hook = heading[1]!), []);
      const example = new RegExp(`^${indent}- ([A-Z][\\w ,'/-]*): (".+)$`).exec(line);
      if (hook && example) byHook.get(hook)!.push(`${example[1]}: ${example[2]}`);
    }
    return byHook;
  };

  it("holds the same three examples for every hook as catalog/hooks.md", () => {
    const fromCatalog = examples(readFileSync(join(root, "catalog", "hooks.md"), "utf8"), "  ");
    const fromReadme = examples(readFileSync(join(root, "examples", "hooks", "README.md"), "utf8"), "");
    expect(fromCatalog.size).toBe(15);
    for (const lines of fromCatalog.values()) expect(lines.length).toBe(3);
    expect(Object.fromEntries(fromReadme)).toEqual(Object.fromEntries(fromCatalog));
  });
});
