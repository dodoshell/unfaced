import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseScript } from "../../engine/src/script/parseScript.js";

const md = (body: string) => `---
title: Why do cats purr?
script_type: 6
hook: 1
ending: 5
---

${body}`;

const basic = md(`## Hook
Why do cats purr?
> visual: a cat on a sofa, eyes half closed

## Body
Most people think purring means a happy cat.

But cats also purr when they are hurt.
> visual: a vet holding a cat

## Ending
Purring might be how cats heal themselves.
`);

describe("parseScript", () => {
  it("reads the front matter", () => {
    const s = parseScript(basic);
    expect(s).toMatchObject({ title: "Why do cats purr?", scriptType: 6, hook: 1, ending: 5, choices: {} });
  });

  it("reads this video's own style, voice, captions and music when the front matter sets them", () => {
    const s = parseScript(basic.replace("ending: 5", "ending: 5\nstyle: 12\nmusic: 8"));
    expect(s.choices).toEqual({ style: 12, music: 8 });
    expect(() => parseScript(basic.replace("ending: 5", "ending: 5\nvoice: auto"))).toThrow(/"voice" must be a catalog number/);
  });

  it("makes one beat for the hook, one per body paragraph and one for the ending", () => {
    const s = parseScript(basic);
    expect(s.beats.map((b) => [b.id, b.kind])).toEqual([
      ["hook", "hook"],
      ["b1", "body"],
      ["b2", "body"],
      ["ending", "ending"],
    ]);
    expect(s.beats[1]!.text).toBe("Most people think purring means a happy cat.");
  });

  it("moves > visual: lines to visual and keeps them out of the spoken text", () => {
    const s = parseScript(basic);
    expect(s.beats[0]!.visual).toBe("a cat on a sofa, eyes half closed");
    expect(s.beats[2]!.visual).toBe("a vet holding a cat");
    expect(s.beats[1]!.visual).toBeUndefined();
    expect(s.spokenText).not.toContain("visual");
    expect(s.spokenText).toBe(
      "Why do cats purr? Most people think purring means a happy cat. But cats also purr when they are hurt. Purring might be how cats heal themselves.",
    );
  });

  it("keeps Italian text and emoji in the beat but drops emoji from the spoken text", () => {
    const s = parseScript(md(`## Hook\nPerché è così? L'acqua… 🐱\n\n## Body\nSì.\n\n## Ending\nCiao 👋🏽!\n`));
    expect(s.beats[0]!.text).toBe("Perché è così? L'acqua… 🐱");
    expect(s.beats[2]!.text).toBe("Ciao 👋🏽!");
    expect(s.spokenText).toBe("Perché è così? L'acqua… Sì. Ciao!");
  });

  it("joins the lines of one paragraph with a space", () => {
    const s = parseScript(md(`## Hook\nWhy do\ncats purr?\n\n## Body\nOne.\n\n## Ending\nEnd.\n`));
    expect(s.beats[0]!.text).toBe("Why do cats purr?");
  });

  it("attaches a visual written as its own paragraph to the beat before it", () => {
    const s = parseScript(md(`## Hook\nHi.\n\n## Body\nOne.\n\n> visual: a ball\n\nTwo.\n\n## Ending\nEnd.\n`));
    expect(s.beats.map((b) => b.id)).toEqual(["hook", "b1", "b2", "ending"]);
    expect(s.beats[1]!.visual).toBe("a ball");
  });

  it("accepts Windows line endings and a byte order mark", () => {
    const s = parseScript(`﻿${basic.replace(/\n/g, "\r\n")}`);
    expect(s.beats).toHaveLength(4);
    expect(s.beats[0]!.text).toBe("Why do cats purr?");
  });

  it("needs a ## Hook section", () => {
    expect(() => parseScript(md(`## Body\nOne.\n\n## Ending\nEnd.\n`))).toThrow("script.md needs a ## Hook section");
  });

  it("needs a ## Body section with at least one paragraph, and a ## Ending section", () => {
    expect(() => parseScript(md(`## Hook\nHi.\n\n## Ending\nEnd.\n`))).toThrow("script.md needs a ## Body section");
    expect(() => parseScript(md(`## Hook\nHi.\n\n## Body\nOne.\n`))).toThrow("script.md needs a ## Ending section");
  });

  it("names a missing or invalid front matter field", () => {
    expect(() => parseScript("## Hook\nHi.\n")).toThrow(/front matter/);
    expect(() => parseScript(basic.replace("hook: 1", "hook: one"))).toThrow(/"hook" must be a catalog number/);
  });

  it("parses the examples in the ready script-type files", () => {
    for (const file of ["06-surprising-answer.md", "09-did-you-know.md"]) {
      const text = readFileSync(join(import.meta.dirname, "..", "..", "catalog", "scripts", file), "utf8");
      const examples = [...text.matchAll(/```markdown\n([\s\S]*?)```/g)].map((m) => m[1]!);
      expect(examples, file).toHaveLength(2);
      for (const example of examples) expect(parseScript(example).beats.length, file).toBeGreaterThanOrEqual(3);
    }
  });
});
