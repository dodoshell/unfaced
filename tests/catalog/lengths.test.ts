// The catalog's own length rules ("under 12 words" for a hook, "under 15 words" for an ending),
// held against every example the repo ships, so an agent copying one learns the rule.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseScript } from "../../engine/src/script/parseScript.js";

const root = join(import.meta.dirname, "..", "..");
const read = (...path: string[]) => readFileSync(join(root, ...path), "utf8");
const words = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const HOOK_MAX = 11;
const ENDING_MAX = 14;

/** Every script the repo ships as an example: the catalog's script types, examples/scripts and each example page's videos. */
function exampleScripts(): Array<[string, string]> {
  const scripts: Array<[string, string]> = [];
  for (const file of readdirSync(join(root, "catalog", "scripts")).filter((f) => /^\d\d-.+\.md$/.test(f))) {
    [...read("catalog", "scripts", file).matchAll(/```markdown\n([\s\S]*?)```/g)].forEach((m, i) => scripts.push([`catalog/scripts/${file} example ${i + 1}`, m[1]!]));
  }
  for (const file of readdirSync(join(root, "examples", "scripts")).filter((f) => f !== "README.md")) scripts.push([`examples/scripts/${file}`, read("examples", "scripts", file)]);
  const pages = [...readdirSync(join(root, "examples", "pages")).map((p) => join("examples", "pages", p)), join("examples", "combos")];
  for (const page of pages) {
    const videos = join(root, page, "videos");
    if (!existsSync(videos)) continue;
    for (const video of readdirSync(videos)) {
      if (existsSync(join(videos, video, "script.md"))) scripts.push([`${page}/videos/${video}/script.md`, read(page, "videos", video, "script.md")]);
    }
  }
  return scripts;
}

describe("example lengths", () => {
  it("keeps every hook example in catalog/hooks.md under 12 words", () => {
    const lines = [...read("catalog", "hooks.md").matchAll(/^ {2}- [A-Z][\w ,'/-]*: "([^"]+)"/gm)].map((m) => m[1]!);
    // Three examples a hook, so a hook whose examples the pattern misses fails here rather than passing unread.
    expect(lines.length).toBe([...read("catalog", "hooks.md").matchAll(/^## \d\d /gm)].length * 3);
    const long = lines.filter((l) => words(l) > HOOK_MAX).map((l) => `${words(l)}: ${l}`);
    expect(long).toEqual([]);
  });

  it("keeps every ending example in catalog/endings.md under 15 words", () => {
    const lines = [...read("catalog", "endings.md").matchAll(/^- Example: "([^"]+)"$/gm)].map((m) => m[1]!);
    expect(lines.length).toBeGreaterThan(0);
    const long = lines.filter((l) => words(l) > ENDING_MAX).map((l) => `${words(l)}: ${l}`);
    expect(long).toEqual([]);
  });

  it("keeps the hook of every example script under 12 words and its ending under 15", () => {
    const scripts = exampleScripts();
    expect(scripts.length).toBeGreaterThan(30);
    const long: string[] = [];
    for (const [where, text] of scripts) {
      const { beats } = parseScript(text);
      const hook = beats.find((b) => b.kind === "hook")!;
      const ending = beats.find((b) => b.kind === "ending")!;
      if (words(hook.text) > HOOK_MAX) long.push(`${where} hook, ${words(hook.text)} words: ${hook.text}`);
      if (words(ending.text) > ENDING_MAX) long.push(`${where} ending, ${words(ending.text)} words: ${ending.text}`);
    }
    expect(long).toEqual([]);
  });
});
