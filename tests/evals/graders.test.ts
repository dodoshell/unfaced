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

  const bash = (command: string) => JSON.stringify({ command, description: "Check the page and make sure it renders" });
  const launcher = "/home/me/unfaced/plugin/skills/video-make/scripts/unfaced.mjs";

  it.each(["video-make-rush", "video-make-stops-for-approval"])("%s no-render: catches a render however the launcher is called", (name) => {
    const render = regex(`${name}/graders/no-render.md`);
    expect(render.test(bash(`node ${launcher} make pages/curious-cats/videos/why-cats-knead`))).toBe(true);
    expect(render.test(bash(`node "${launcher}" frames videos/x --every 1s`))).toBe(true);
    expect(render.test(bash(`npm run unfaced -- cover videos/x`))).toBe(true);
    expect(render.test(bash(`U="node ${launcher}"; $U page .; $U make videos/x`))).toBe(true);
    expect(render.test(bash(`U="node ${launcher}"; "$U" check videos/x`))).toBe(true);
    expect(render.test(bash(`U="node ${launcher}"; $U page .; $U docs script; $U show hook 1`))).toBe(false);
    expect(render.test(bash(`node ${launcher} list hook; grep -i check notes.md`))).toBe(false);
  });

  it("video-recommend-options read-the-catalog: counts a list or show however the launcher is called", () => {
    const read = regex("video-recommend-options/graders/read-the-catalog.md");
    expect(read.test(bash(`node "${launcher}" list style`))).toBe(true);
    expect(read.test(bash(`U="node ${launcher}"; cd pages/curious-cats; $U page .; $U list hook`))).toBe(true);
    expect(read.test(bash(`U=${launcher}; node $U show script 6`))).toBe(true);
    expect(read.test(bash(`U="node ${launcher}"; $U page pages/curious-cats`))).toBe(false);
    expect(read.test(bash("ls catalog; cat catalog/hooks.md"))).toBe(false);
  });

  it("page-setup-you-choose validated: counts unfaced page however the launcher is called", () => {
    const validated = regex("page-setup-you-choose/graders/validated.md");
    expect(validated.test(bash(`node "${launcher}" page pages/deep-weird`))).toBe(true);
    expect(validated.test(bash(`U="node ${launcher}"; $U page pages/deep-weird 2>&1 | tail -5`))).toBe(true);
    expect(validated.test(bash(`U="node ${launcher}"; $U docs page; $U list style`))).toBe(false);
  });

  it.each([
    ["page-results-no-numbers", "page-not-edited"],
    ["page-results-three-changes", "page-not-edited"],
    ["page-results-three-changes", "page-not-rewritten"],
    ["video-recommend-one-off-style", "page-not-edited"],
    ["video-recommend-one-off-style", "page-not-rewritten"],
  ])("%s %s: counts a change to page.yaml, not a note that names it", (name, file) => {
    const touched = regex(`${name}/graders/${file}.md`);
    expect(touched.test(JSON.stringify({ file_path: "/w/pages/curious-cats/page.yaml", old_string: "style: 3", new_string: "style: 1" }))).toBe(true);
    expect(touched.test(JSON.stringify({ file_path: "C:\\w\\pages\\curious-cats\\page.yaml", content: "name: Curious Cats" }))).toBe(true);
    expect(touched.test(JSON.stringify({ file_path: "/w/pages/curious-cats/results.md", old_string: "", new_string: "## Notes\n- page.yaml left as it is" }))).toBe(false);
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

  it("post-make no-render: catches `unfaced post`, not post-type, docs post or the other commands", () => {
    for (const name of ["post-make-stops-for-approval", "post-make-keeps-user-text"]) {
      const render = regex(`${name}/graders/no-render.md`);
      const launcher = "/home/me/unfaced/plugin/skills/post-make/scripts/unfaced.mjs";
      expect(render.test(bash(`node ${launcher} post pages/studio-nord/posts/about-us`))).toBe(true);
      expect(render.test(bash(`node "${launcher}" post pages/studio-nord/posts/about-us --format story`))).toBe(true);
      expect(render.test(bash(`npm run unfaced -- post pages/studio-nord/posts/about-us`))).toBe(true);
      expect(render.test(bash(`U="node ${launcher}"; $U page pages/studio-nord; $U post pages/studio-nord/posts/x`))).toBe(true);
      expect(render.test(bash(`U="node ${launcher}"; $U page pages/studio-nord; $U docs post; $U list post-type; $U show post-type 3`))).toBe(false);
      expect(render.test(bash(`node ${launcher} docs slides; node ${launcher} show post-type 3`))).toBe(false);
    }
  });

  it("post-make-keeps-user-text: needs all five sentences, word for word", () => {
    const kept = regex("post-make-keeps-user-text/graders/user-text-verbatim.md");
    const sentences = [
      "We build websites for shop owners who have no time to waste.",
      "Every project starts with a free call, never a long form.",
      "You get a fixed price before we write a single line.",
      "Most shops are online in three weeks.",
      "Tell us what you sell and we do the rest.",
    ];
    const slides = (lines: string[]) =>
      `---\ntitle: About us\npost_type: 3\n---\n\n## cover\n# Studio *Nord*\n\n${lines.map((l) => `## point\n${l}\n`).join("\n")}`;
    expect(kept.test(slides(sentences))).toBe(true);
    expect(kept.test(slides(sentences.slice(0, 4)))).toBe(false);
    expect(kept.test(slides(sentences.map((l) => l.replace("free call", "free chat"))))).toBe(false);
  });

  it("post-make slides-parse: wants a cover first and another slide after it", () => {
    const parses = regex("post-make-stops-for-approval/graders/slides-parse.md");
    expect(parses.test("---\ntitle: T\npost_type: 1\n---\n\n## cover\n# Hi\n\n## point\n# Two\n")).toBe(true);
    expect(parses.test("## cover\n# Hi\n\n## cta\n# Go\n")).toBe(true);
    expect(parses.test("---\ntitle: T\n---\n\n## point\n# Two\n\n## cta\n# Go\n")).toBe(false);
  });
});
