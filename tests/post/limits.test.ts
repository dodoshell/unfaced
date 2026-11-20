import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { registerSlideLayout } from "../../engine/remotion/styles/slideLayouts.js";
import type { Page } from "../../engine/src/page/types.js";
import { buildPostPlans } from "../../engine/src/post/buildPostPlan.js";
import { LIMITS, slideLimit } from "../../engine/src/post/limits.js";
import { parseSlides } from "../../engine/src/post/parseSlides.js";
import type { Slide } from "../../engine/src/post/types.js";
import { PLACEHOLDER_SLIDES, placeholderSlides } from "../fixtures/remotion/placeholderSlides.js";
import { catalogWithSlides } from "./catalogWithSlides.js";

const slide = (text: string): Slide => parseSlides(`---\ntitle: x\npost_type: 1\n---\n\n${text}\n`).slides[0]!;
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const items = (n: number, w = 2, mark = "") => Array.from({ length: n }, (_, i) => `- ${mark}${words(w)} ${i}`.replace(/ \d+$/, "")).join("\n");

describe("slide limits", () => {
  it("lets every kind through at its limit", () => {
    expect(slideLimit(slide(`## cover\n# ${words(LIMITS.coverWords)}`))).toBeUndefined();
    expect(slideLimit(slide(`## point\n# P\n${words(LIMITS.pointWords)}`))).toBeUndefined();
    expect(slideLimit(slide(`## list\n# L\n${items(LIMITS.listItems, LIMITS.listWords)}`))).toBeUndefined();
    expect(slideLimit(slide(`## steps\n# S\n${items(LIMITS.steps.max, LIMITS.stepWords)}`))).toBeUndefined();
    expect(slideLimit(slide("## steps {filled: software}\n# S\n- Topic | us\n- Text | software"))).toBeUndefined();
    expect(slideLimit(slide(`## compare\n# C\n${items(4, 3, "✗ ")}\n${items(4, 3, "✓ ")}`))).toBeUndefined();
    expect(slideLimit(slide("## stat\n# +120.000\nvisitors"))).toBeUndefined();
    expect(slideLimit(slide(`## quote\n# "${words(LIMITS.quoteWords)}"\nAnna`))).toBeUndefined();
    expect(slideLimit(slide("## image {photo: inbox/a.jpg}\n# Our shop"))).toBeUndefined();
    expect(slideLimit(slide("## cta\n# Talk?\n[Write to us]"))).toBeUndefined();
  });

  it("says what is over the limit and by how much", () => {
    expect(slideLimit(slide(`## cover\n# ${words(13)}`))).toBe("a cover headline takes up to 12 words; this one has 13");
    expect(slideLimit(slide(`## point\n# P\n${words(46)}`))).toBe("a point's body takes up to 45 words; this one has 46");
    expect(slideLimit(slide(`## list\n# L\n${items(6)}`))).toBe("a list takes up to 5 items; this one has 6");
    expect(slideLimit(slide(`## list\n# L\n- one\n- ${words(9)}`))).toMatch(/^item 2 \(".*"\) has 9 words; a list takes up to 8 per item$/);
    expect(slideLimit(slide(`## steps\n# S\n${items(7)}`))).toBe("a steps slide takes 2 to 6 steps (- lines); this one has 7");
    expect(slideLimit(slide("## steps\n# S\n- one"))).toMatch(/2 to 6 steps.*has 1/);
    expect(slideLimit(slide(`## steps\n# S\n- one two three four\n- b`))).toMatch(/^step 1 .* has 4 words; a steps slide takes up to 3 per step \(put the rest in its second line/);
    expect(slideLimit(slide("## steps {filled: sofware}\n# S\n- Topic | us\n- Text | software"))).toBe(`{filled: sofware} names no step's second line; the second lines are "us" and "software"`);
    expect(slideLimit(slide("## steps {filled: us}\n# S\n- Topic\n- Text"))).toBe("{filled: us} names no step's second line; these steps have none (- Step | who)");
    expect(slideLimit(slide(`## compare\n# C\n${items(5, 2, "✓ ")}\n${items(1, 2, "✗ ")}`))).toBe("a compare slide takes up to 4 items per side; the ✓ side has 5");
    expect(slideLimit(slide("## stat\n# +1.250.000\nvisitors"))).toBe('a stat\'s figure takes up to 8 characters; "+1.250.000" has 10');
    expect(slideLimit(slide(`## quote\n# ${words(36)}\nAnna`))).toBe("a quote takes up to 35 words; this one has 36");
    expect(slideLimit(slide("## image\n# Our shop"))).toMatch(/needs a photo from the post's inbox\/: ## image \{photo: inbox\/shop\.jpg\}/);
    expect(slideLimit(slide("## cta\n# Talk?"))).toMatch(/needs its button/);
    expect(slideLimit(slide(`## cover {visual: chips}\n# Hi\n${items(5)}`))).toBe("a cover's chips takes up to 4 chips; this one has 5");
    expect(slideLimit(slide(`## cover {visual: phone, screen: "${words(9)}"}\n# Hi`))).toBe("the phone's screen takes up to 8 words; this one has 9");
    expect(slideLimit(slide("## cover {visual: notification}\n# Hi"))).toMatch(/needs a title or a text/);
    expect(slideLimit(slide("## cover {visual: rocket}\n# Hi"))).toBe('a cover\'s visual is chips, phone or notification, not "rocket"');
  });
});

describe("buildPostPlans and the limits", () => {
  beforeAll(() => {
    registerSlideLayout(PLACEHOLDER_SLIDES, placeholderSlides);
  });

  it("refuses a slide past its kind's limit before laying anything out, naming the line, the slide and the limit", () => {
    const pageDir = mkdtempSync(join(tmpdir(), "unfaced page "));
    const dir = join(pageDir, "posts", "p");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "slides.md"), `---\ntitle: x\npost_type: 1\n---\n\n## cover\n# Hi\n\n## list\n# What we make\n${items(6)}\n`);
    const page: Page = { dir: pageDir, name: "P", language: "en", niche: "x", choices: {}, postStyle: PLACEHOLDER_SLIDES, providers: { voice: "kokoro", ai_clips: "none", images: "none" } };
    expect(() => buildPostPlans(dir, page, catalogWithSlides())).toThrow("slides.md line 9 (slide 2, list): a list takes up to 5 items; this one has 6");
  });
});
