// The eval cases' setup: a case that runs the CLI needs the library its sandbox can't reach.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const evals = join(import.meta.dirname, "..", "..", "evals");
const cases = readdirSync(evals, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(evals, entry.name, "prompt.md")))
  .map((entry) => entry.name);
const tags = (name: string) => {
  const text = readFileSync(join(evals, name, "prompt.md"), "utf8");
  return (parse(/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)![1]!) as { tags: string[] }).tags;
};

describe("eval cases", () => {
  it("finds the cases", () => {
    expect(cases.length).toBeGreaterThan(20);
  });

  it.each(cases.filter((name) => tags(name).includes("shell")))("%s: its scaffold installs the library", (name) => {
    expect(readFileSync(join(evals, name, "case.yaml"), "utf8")).toMatch(/^\s+scaffold_script: scaffold\.sh$/m);
    expect(readFileSync(join(evals, name, "scaffold.sh"), "utf8")).toContain('bash "$here/../fixtures/library.sh"');
  });
});
