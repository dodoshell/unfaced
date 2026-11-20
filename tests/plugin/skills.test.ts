import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { FORMATS } from "../../engine/src/cli/docs.js";

const root = join(import.meta.dirname, "..", "..");
const skillsDir = join(root, "plugin", "skills");
const skills = readdirSync(skillsDir).filter((d) => !d.startsWith(".") && existsSync(join(skillsDir, d, "SKILL.md")));
// Frontmatter keys every agent that reads Agent Skills accepts.
const PORTABLE = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];

function frontMatter(file: string): { meta: Record<string, unknown>; body: string } {
  const text = readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, "\n"));
  if (!match) throw new Error(`${file} has no front matter`);
  return { meta: parse(match[1]!) as Record<string, unknown>, body: match[2]! };
}

const usage = execFileSync(process.execPath, ["--import", "tsx", join(root, "engine", "src", "cli.ts"), "help"], { cwd: root, encoding: "utf8" });
const COMMANDS = [...usage.matchAll(/^ {2}([a-z]+)\b/gm)].map((m) => m[1]!);

describe("skills", () => {
  it.each(skills)("%s has portable front matter naming it and saying when to use it", (skill) => {
    const { meta } = frontMatter(join(skillsDir, skill, "SKILL.md"));
    expect(meta.name).toBe(skill);
    expect(Object.keys(meta).filter((k) => !PORTABLE.includes(k))).toEqual([]);
    expect(String(meta.description)).toMatch(/^Use when /);
    expect(String(meta.description).length).toBeLessThanOrEqual(1024);
  });

  it.each(skills)("%s only uses commands and formats the CLI has", (skill) => {
    const { body } = frontMatter(join(skillsDir, skill, "SKILL.md"));
    for (const [, command] of body.matchAll(/`unfaced ([a-z]+)/g)) expect(COMMANDS, `${skill}: unfaced ${command}`).toContain(command);
    for (const [, format] of body.matchAll(/`unfaced docs ([a-z]+)`/g)) expect(FORMATS, `${skill}: unfaced docs ${format}`).toContain(format);
  });

  it.each(skills)("%s only points at files it carries", (skill) => {
    const { body } = frontMatter(join(skillsDir, skill, "SKILL.md"));
    for (const [path] of body.matchAll(/\b(?:references|scripts)\/[\w.-]+/g)) expect(existsSync(join(skillsDir, skill, path)), `${skill}: ${path}`).toBe(true);
  });

  it.each([["video-make", "video-reviewer"], ["post-make", "post-reviewer"]])("carries the reviewer's instructions, unchanged, in %s for agents without subagents", (skill, agent) => {
    const copy = join(skillsDir, skill, "references", `${agent}.md`);
    expect(existsSync(copy), `${skill}/references/${agent}.md`).toBe(true);
    expect(readFileSync(copy, "utf8"), `copy plugin/agents/${agent}.md again`).toBe(readFileSync(join(root, "plugin", "agents", `${agent}.md`), "utf8"));
    expect(frontMatter(join(skillsDir, skill, "SKILL.md")).body).toContain(`references/${agent}.md`);
  });

  it("has a post-make skill that names the post reviewer, its copy and the commands that make a post", () => {
    expect(skills).toContain("post-make");
    const { body } = frontMatter(join(skillsDir, "post-make", "SKILL.md"));
    for (const word of ["post-reviewer", "references/post-reviewer.md", "unfaced post", "unfaced inbox", "unfaced generate", "slides.md", "post.md", "grid.png"]) expect(body, word).toContain(word);
  });

  it.each(["video-reviewer", "post-reviewer"])("has a reviewer agent %s with a name, a description and its tools", (agent) => {
    const { meta, body } = frontMatter(join(root, "plugin", "agents", `${agent}.md`));
    expect(meta).toMatchObject({ name: agent, tools: expect.stringContaining("Read") });
    expect(String(meta.description).length).toBeGreaterThan(50);
    expect(body).toContain("# Review: PASS");
  });
});
