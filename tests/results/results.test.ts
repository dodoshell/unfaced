import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { resultsReport } from "../../engine/src/cli/results.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import { compareResults, parseResults, readVideoFacts, type VideoFacts } from "../../engine/src/results/results.js";

const catalog = Catalog.load(CATALOG_DIR);
const HEAD = "| Video | Platform | Posted | Views | Avg watched | Likes | Comments | Shares | Saves | Follows | Notes |\n|---|---|---|---|---|---|---|---|---|---|---|\n";

describe("reading results.md", () => {
  it("reads the format's own example", () => {
    const md = `# Results\n\n${HEAD}| why-cats-purr | TikTok | 2026-11-14 | 12400 | 71% | 980 | 45 | 120 | 210 | 38 | trending sound added |\n| why-cats-purr | Instagram | 2026-11-14 18:30 | 3100 | 9.8s | 240 | 6 | 15 | 40 | 4 | |\n`;
    const { rows, problems } = parseResults(md);
    expect(problems).toEqual([]);
    expect(rows).toEqual([
      { row: 1, video: "why-cats-purr", platform: "TikTok", posted: "2026-11-14", views: 12400, watched: { share: 0.71 }, likes: 980, comments: 45, shares: 120, saves: 210, follows: 38, notes: "trending sound added" },
      { row: 2, video: "why-cats-purr", platform: "Instagram", posted: "2026-11-14 18:30", views: 3100, watched: { sec: 9.8 }, likes: 240, comments: 6, shares: 15, saves: 40, follows: 4 },
    ]);
  });

  it("reads columns by name, in any order, and ignores the ones it doesn't know", () => {
    const md = "| Platform | Video | Views | Reach |\n|---|---|---|---|\n| YouTube | a | 900 | 1200 |\n";
    expect(parseResults(md).rows).toEqual([{ row: 1, video: "a", platform: "YouTube", views: 900 }]);
  });

  it("names every cell it can't read, and a second row for the same video and platform", () => {
    const md = `${HEAD}| a | TikTok | 14/11/2026 | 12,400 | 71 | | | | | | |\n| a | tiktok | 2026-11-15 | 100 | 50% | | | | | | |\n`;
    const { rows, problems } = parseResults(md);
    expect(rows).toHaveLength(2);
    expect(problems).toEqual([
      'row 1: Posted "14/11/2026" is not a date; write 2026-11-14',
      'row 1: Views "12,400" is not a number; write it without separators (12400)',
      'row 1: Avg watched "71" needs a unit: a share (71%) or seconds (9.8s)',
      "row 2: a on TikTok already has row 1; update that row instead",
    ]);
  });

  it("says when there is no table to read", () => {
    expect(parseResults("# Results\n\nNothing yet.\n").problems).toEqual(["results.md has no table with Video and Platform columns (format: unfaced docs results)"]);
  });
});

function page(results: string, videos: Record<string, { script?: string; plan?: object }>): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced results "));
  writeFileSync(join(dir, "results.md"), results);
  for (const [name, files] of Object.entries(videos)) {
    mkdirSync(join(dir, "videos", name), { recursive: true });
    if (files.script) writeFileSync(join(dir, "videos", name, "script.md"), files.script);
    if (files.plan) writeFileSync(join(dir, "videos", name, "plan.json"), JSON.stringify(files.plan));
  }
  return dir;
}

const script = (scriptType: number, hook: number, ending: number) => `---\ntitle: T\nscript_type: ${scriptType}\nhook: ${hook}\nending: ${ending}\n---\n\n## Hook\nH.\n\n## Body\nB.\n\n## Ending\nE.\n`;
const plan = (sec: number, extra: object = {}) => ({ fps: 30, width: 1080, height: 1920, durationInFrames: sec * 30, style: 3, captions: 1, voice: 1, palette: [], scenes: [], ...extra });

describe("a video's choices", () => {
  it("takes what the video was made with from plan.json and the hook from script.md", () => {
    const dir = page("", { a: { script: script(6, 1, 5), plan: plan(30, { scriptType: 6, ending: 5, music: 3 }) } });
    expect(readVideoFacts(join(dir, "videos", "a"))).toEqual({ lengthSec: 30, choices: { style: 3, captions: 1, voice: 1, music: 3, script: 6, hook: 1, ending: 5 } });
  });

  it("counts a plan without music as music 08 None, and reads the script alone before the video is made", () => {
    const dir = page("", { a: { plan: plan(15) }, b: { script: `---\ntitle: T\nscript_type: 9\nhook: 3\nending: 2\nstyle: 4\n---\n\n## Hook\nH.\n\n## Body\nB.\n\n## Ending\nE.\n` } });
    expect(readVideoFacts(join(dir, "videos", "a"))).toEqual({ lengthSec: 15, choices: { style: 3, captions: 1, voice: 1, music: 8 } });
    expect(readVideoFacts(join(dir, "videos", "b"))).toEqual({ choices: { style: 4, script: 9, hook: 3, ending: 2 } });
  });
});

describe("comparing the videos", () => {
  const facts = new Map<string, VideoFacts>([
    ["a", { lengthSec: 30, choices: { style: 3, captions: 1, voice: 1, music: 8, script: 6, hook: 1, ending: 5 } }],
    ["b", { lengthSec: 45, choices: { style: 3, captions: 1, voice: 1, music: 8, script: 9, hook: 3, ending: 5 } }],
    ["c", { lengthSec: 30, choices: { style: 3, captions: 1, voice: 1, music: 8, script: 6, hook: 1, ending: 5 } }],
  ]);
  const md = `${HEAD}| b | TikTok | 2026-11-01 | 5000 | 35% | 100 | 10 | 20 | 30 | 5 | |\n| a | TikTok | 2026-11-01 | 10000 | 70% | 500 | 40 | 100 | 200 | 30 | |\n| c | TikTok | 2026-11-02 | 8000 | 60% | | 8 | 40 | 40 | 8 | |\n| a | Instagram | 2026-11-12 | 2000 | 9s | 50 | 2 | 4 | 6 | 1 | |\n`;
  const report = compareResults(parseResults(md).rows, facts, catalog, new Date("2026-11-14T12:00:00"));

  it("ranks each platform's videos by average watched, converting seconds with the video's length", () => {
    const tiktok = report.slice(report.indexOf("## TikTok"), report.indexOf("## Instagram"));
    expect(tiktok.filter((l) => /^\| \d/.test(l))).toEqual([
      "| 1 | a | 70% | 10000 | 3.0% | 0.30% | 0.40% | 30 s |",
      "| 2 | c | 60% | 8000 | 1.0% | 0.10% | 0.10% | 30 s |",
      "| 3 | b | 35% | 5000 | 1.0% | 0.10% | 0.20% | 45 s |",
    ]);
    const instagram = report.slice(report.indexOf("## Instagram"));
    expect(instagram).toContain("| 1 | a | 30% | 2000 | 0.50% | 0.05% | 0.10% | 30 s |");
  });

  it("compares the median watched of each choice that varies, and calls groups under 3 videos thin", () => {
    expect(report).toContain("- hook: 01 Shocking question 65% (2 videos, thin) · 03 You're doing it wrong 35% (1 video, thin)");
    expect(report).toContain("- script: 06 Surprising answer 65% (2 videos, thin) · 09 Did you know 35% (1 video, thin)");
    expect(report).toContain("- length: 02 30 seconds 65% (2 videos, thin) · 03 45 seconds 35% (1 video, thin)");
    expect(report).toContain("Same in every video, so they explain nothing: style 03 Flat cartoon, voice 01 Calm documentary, captions 01 Word-by-word karaoke, music 08 None, ending 05 Punchline.");
  });

  it("warns about numbers from the first week", () => {
    expect(report).toContain("- a on Instagram was posted 2 days ago: numbers move a lot in the first week.");
    expect(report.some((l) => l.startsWith("- a on TikTok"))).toBe(false);
  });

  it("says today for a video posted today, and flags a date in the future", () => {
    const rows = parseResults(`${HEAD}| a | TikTok | 2026-11-14 | 10 | 50% | | | | | | |\n| b | TikTok | 2026-11-16 | 10 | 50% | | | | | | |\n`).rows;
    const lines = compareResults(rows, facts, catalog, new Date("2026-11-14T12:00:00"));
    expect(lines).toContain("- a on TikTok was posted today: numbers move a lot in the first week.");
    expect(lines).toContain("- b on TikTok: Posted 2026-11-16 is in the future.");
  });
});

describe("unfaced results", () => {
  it("joins results.md with the page's videos and fails on a video it can't find", async () => {
    const dir = page(`${HEAD}| a | TikTok | 2026-11-01 | 100 | 50% | | | | | | |\n| ghost | TikTok | 2026-11-01 | 100 | 20% | | | | | | |\n`, { a: { script: script(6, 1, 5), plan: plan(30) } });
    const { lines, pass } = await resultsReport(dir, catalog, new Date("2026-11-14"));
    expect(lines[0]).toBe("Results: 2 rows, 2 videos, 1 platform");
    expect(lines).toContain("| 1 | a | 50% | 100 | — | — | — | 30 s |");
    expect(lines).toContain("- row 2: no folder videos/ghost; the Video column must be a folder name in videos/");
    expect(pass).toBe(false);
  });

  it("says what to collect when the page has no results.md yet", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced results "));
    const { lines, pass } = await resultsReport(dir, catalog, new Date("2026-11-14"));
    expect(lines[0]).toBe(`No results.md in ${dir} yet. After posting, record each video's numbers there (format: unfaced docs results).`);
    expect(pass).toBe(false);
  });
});
