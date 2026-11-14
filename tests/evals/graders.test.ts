// The eval graders that are plain patterns, tried on answers they must pass and answers they
// must fail, so a grader can't quietly pass everything or fail a correct run.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const evals = join(import.meta.dirname, "..", "..", "evals");
const grader = (path: string) => {
  const text = readFileSync(join(evals, path), "utf8");
  return parse(/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)![1]!) as { type: string; pattern?: string; flags?: string; input_match?: string };
};
const regex = (path: string) => {
  const g = grader(path);
  return new RegExp(g.pattern ?? g.input_match!, g.flags ?? "");
};

const script = (frontMatter: string, hook: string) => `---\ntitle: Why cats knead\n${frontMatter}\n---\n\n## Hook\n${hook}\n\n## Body\nOne.\n\n## Ending\nBye.\n`;

describe("eval graders", () => {
  it("video-make-rush: counts only a script written in a new video folder, not the fixture's two", () => {
    const g = grader("video-make-rush/graders/script-written.md");
    expect(g.type).toBe("tool_used");
    const written = regex("video-make-rush/graders/script-written.md");
    expect(written.test(JSON.stringify({ file_path: "C:\\w\\pages\\curious-cats\\videos\\cats-see-in-the-dark\\script.md" }))).toBe(true);
    expect(written.test(JSON.stringify({ file_path: "/w/pages/curious-cats/videos/night-vision/script.md" }))).toBe(true);
    expect(written.test(JSON.stringify({ file_path: "/w/pages/curious-cats/videos/why-cats-purr/script.md" }))).toBe(false);
    expect(written.test(JSON.stringify({ file_path: "C:\\w\\pages\\curious-cats\\videos\\cats-and-milk\\script.md" }))).toBe(false);
  });

  it("video-make-stops-for-approval page-choices: accepts the page's picks with or without a comment", () => {
    const choices = regex("video-make-stops-for-approval/graders/page-choices.md");
    expect(choices.test(script("script_type: 6\nhook: 1\nending: 5", "Hi."))).toBe(true);
    expect(choices.test(script("script_type: 09   # Did you know\nhook: 1\nending: 05 # Punchline", "Hi."))).toBe(true);
    expect(choices.test(script("script_type: 6\r\nhook: 1\r\nending: 5", "Hi.").replace(/\n/g, "\r\n"))).toBe(true);
    expect(choices.test(script("script_type: 3\nhook: 1\nending: 5", "Hi."))).toBe(false);
    expect(choices.test(script("script_type: 6\nhook: 1\nending: 2", "Hi."))).toBe(false);
  });

  it("video-make-stops-for-approval short-hook: passes a hook under 12 words, on one line, and nothing longer", () => {
    const short = regex("video-make-stops-for-approval/graders/short-hook.md");
    expect(short.test(script("script_type: 6", "Your cat is baking bread on your blanket. Here's why."))).toBe(true);
    expect(short.test(script("script_type: 6", "Why do cats knead?\n> visual: paws on a blanket"))).toBe(true);
    expect(short.test(`---\nx: 1\n---\n\n## Hook\n\nWhy do cats knead?`)).toBe(true);
    expect(short.test(script("script_type: 6", "one two three four five six seven eight nine ten eleven"))).toBe(true);
    expect(short.test(script("script_type: 6", "one two three four five six seven eight nine ten eleven twelve"))).toBe(false);
    expect(short.test(script("script_type: 6", "Why do cats knead\nsoft blankets with both paws when they feel safe and warm?"))).toBe(false);
  });
});
