import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { registerSlideLayout } from "../../engine/remotion/styles/slideLayouts.js";
import { checkPostDir } from "../../engine/src/cli/check.js";
import { makePost, parsePostArgs, type PostDeps } from "../../engine/src/cli/post.js";
import type { CheckReport } from "../../engine/src/check/types.js";
import type { PostPlan } from "../../engine/src/post/buildPostPlan.js";
import { PLACEHOLDER_SLIDES, placeholderSlides } from "../fixtures/remotion/placeholderSlides.js";
import { catalogWithSlides } from "../post/catalogWithSlides.js";

const slides = (front = "") => `---
title: Who we are
post_type: 3
${front}---

## cover
# This page is made by *our software*
No filming, no faces.

## point
# Why *no faces*
You have no time to film.

## cta
# Want posts *like this*?
[Join the list]
`;

/** A page folder (spaces and an accent in its path) holding one post. */
function setup(front = "", pageYaml = ""): { pageDir: string; dir: string } {
  const pageDir = join(mkdtempSync(join(tmpdir(), "unfaced post ")), "my page è");
  const dir = join(pageDir, "posts", "about-us");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(pageDir, "page.yaml"), `name: Studio\nlanguage: en\nniche: software\nstyle: { posts: ${PLACEHOLDER_SLIDES} }\nbrand:\n  handle: "@studio"\n${pageYaml}`);
  writeFileSync(join(dir, "slides.md"), slides(front));
  return { pageDir, dir };
}

const catalog = catalogWithSlides();

function stubs() {
  const render = vi.fn<PostDeps["render"]>(async (plan, outDir) => {
    mkdirSync(outDir, { recursive: true });
    const files = plan.slides.map((_, i) => join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`));
    files.push(join(outDir, "grid.png"));
    for (const file of files) writeFileSync(file, "png");
    return files;
  });
  const writePdf = vi.fn<PostDeps["writePdf"]>(async (_pngs, out) => writeFileSync(out, "pdf"));
  const close = vi.fn(async () => {});
  const deps: PostDeps = { catalog, render, writePdf, close, log: () => {} };
  return { deps, render, writePdf, close };
}

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

beforeAll(() => {
  registerSlideLayout(PLACEHOLDER_SLIDES, placeholderSlides);
});

describe("unfaced post", () => {
  it("writes post-plan.json and check.json, then renders the slides and the grid into the post folder", async () => {
    const { pageDir, dir } = setup();
    const { deps, render, writePdf, close } = stubs();
    const { pass, files } = await makePost(dir, deps);

    expect(pass).toBe(true);
    const plans = readJson(join(dir, "post-plan.json")) as PostPlan[];
    expect(plans.map((p) => p.format.name)).toEqual(["instagram-carousel"]);
    expect(plans[0]!.slides).toHaveLength(3);
    expect(readJson(join(dir, "check.json"))).toEqual({ pass: true, issues: [] });
    expect(render).toHaveBeenCalledTimes(1);
    const [plan, outDir, renderPage, options] = render.mock.calls[0]!;
    expect(plan.format.name).toBe("instagram-carousel");
    expect(outDir).toBe(dir);
    expect(renderPage).toBe(pageDir);
    expect(options).toEqual({ postDir: dir });
    expect(files).toEqual(["slide-01.png", "slide-02.png", "slide-03.png", "grid.png"].map((f) => join(dir, f)));
    expect(writePdf).not.toHaveBeenCalled();
    expect(existsSync(join(dir, "post.pdf"))).toBe(false);
    expect(close).toHaveBeenCalled();
  });

  it("fails when a check fails, and still renders so the user can see why", async () => {
    // Ink one shade off the ground: the contrast check fails.
    const { dir } = setup("", `palette: ["#888888", "#4F8CFF", "#7FB0FF", "#2F9E6A", "#777777"]\n`);
    const { deps, render } = stubs();
    const { pass } = await makePost(dir, deps);

    expect(pass).toBe(false);
    const report = readJson(join(dir, "check.json")) as CheckReport;
    expect(report.pass).toBe(false);
    expect(report.issues.map((i) => i.check)).toContain("contrast");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("writes post.pdf from the slides, without the grid, for linkedin-carousel only", async () => {
    const { dir } = setup("format: [linkedin-carousel]\n");
    const { deps, writePdf } = stubs();
    const { files } = await makePost(dir, deps);

    expect(writePdf).toHaveBeenCalledTimes(1);
    expect(writePdf).toHaveBeenCalledWith(["slide-01.png", "slide-02.png", "slide-03.png"].map((f) => join(dir, f)), join(dir, "post.pdf"));
    expect(files).toContain(join(dir, "post.pdf"));
  });

  it("puts each format's files in its own folder when it makes two formats", async () => {
    const { dir } = setup("format: [instagram-carousel, linkedin-carousel]\n");
    const { deps, render, writePdf } = stubs();
    const { files } = await makePost(dir, deps);

    expect(render.mock.calls.map((c) => c[1])).toEqual([join(dir, "instagram-carousel"), join(dir, "linkedin-carousel")]);
    expect(writePdf).toHaveBeenCalledWith(expect.any(Array), join(dir, "linkedin-carousel", "post.pdf"));
    expect(files).toContain(join(dir, "instagram-carousel", "grid.png"));
    expect((readJson(join(dir, "post-plan.json")) as PostPlan[]).map((p) => p.format.name)).toEqual(["instagram-carousel", "linkedin-carousel"]);
  });

  it("makes only the format it is asked for", async () => {
    const { dir } = setup("format: [instagram-carousel, linkedin-carousel]\n");
    const { deps, render } = stubs();
    await makePost(dir, deps, { format: "story" });

    expect(render.mock.calls.map((c) => [c[0].format.name, c[1]])).toEqual([["story", dir]]);
  });

  it("removes a post.pdf left from an earlier linkedin-carousel when this run makes none", async () => {
    const { dir } = setup("format: [linkedin-carousel]\n");
    await makePost(dir, stubs().deps);
    expect(existsSync(join(dir, "post.pdf"))).toBe(true);
    writeFileSync(join(dir, "slides.md"), slides("format: [instagram-carousel]\n"));
    const { files } = await makePost(dir, stubs().deps);
    expect(existsSync(join(dir, "post.pdf"))).toBe(false);
    expect(files).not.toContain(join(dir, "post.pdf"));
  });

  it("stops before rendering when slides.md is missing", async () => {
    const { deps, render } = stubs();
    const empty = mkdtempSync(join(tmpdir(), "unfaced no post "));
    await expect(makePost(empty, deps)).rejects.toThrow(/slides\.md not found/);
    expect(render).not.toHaveBeenCalled();
  });

  it("removes the last run's post-plan.json and check.json when the plans cannot be built, so no old PASS is left", async () => {
    const { dir } = setup();
    await makePost(dir, stubs().deps);
    expect(existsSync(join(dir, "check.json"))).toBe(true);
    writeFileSync(join(dir, "slides.md"), slides().replace("## cover", "## nope"));
    const { deps, render } = stubs();
    await expect(makePost(dir, deps)).rejects.toThrow(/unknown slide kind "nope"/);
    expect(render).not.toHaveBeenCalled();
    expect(existsSync(join(dir, "post-plan.json"))).toBe(false);
    expect(existsSync(join(dir, "check.json"))).toBe(false);
    expect(() => checkPostDir(dir)).toThrow(/post-plan\.json not found/);
  });
});

describe("unfaced check on a post folder", () => {
  it("re-runs the post checks from post-plan.json and rewrites check.json", async () => {
    const { dir } = setup();
    await makePost(dir, stubs().deps);
    const plans = readJson(join(dir, "post-plan.json")) as PostPlan[];
    plans[0]!.slides[1]!.boxes[0]!.y = 1300;
    writeFileSync(join(dir, "post-plan.json"), JSON.stringify(plans));

    const report = checkPostDir(dir);
    expect(report.pass).toBe(false);
    expect(report.issues.map((i) => i.check)).toContain("post-safe-area");
    expect(readJson(join(dir, "check.json"))).toEqual(report);
  });

  it("asks for unfaced post first when there is no post-plan.json", () => {
    const { dir } = setup();
    expect(() => checkPostDir(dir)).toThrow(/post-plan\.json not found.*unfaced post/);
  });
});

describe("unfaced post arguments", () => {
  it("takes --format before or after the folder", () => {
    expect(parsePostArgs(["posts/a", "--format", "story"])).toEqual({ dir: "posts/a", format: "story" });
    expect(parsePostArgs(["--format", "story", "posts/a"])).toEqual({ dir: "posts/a", format: "story" });
    expect(parsePostArgs(["posts/a"])).toEqual({ dir: "posts/a" });
  });

  it("names what is missing or unknown", () => {
    expect(() => parsePostArgs(["--format", "story"])).toThrow(/post folder/);
    expect(() => parsePostArgs(["posts/a", "--format"])).toThrow(/--format/);
    expect(() => parsePostArgs(["posts/a", "--format", "tiktok"])).toThrow(/Unknown post format "tiktok"/);
    expect(() => parsePostArgs(["posts/a", "--square"])).toThrow(/--square/);
  });
});
