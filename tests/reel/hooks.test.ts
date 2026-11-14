import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOOK_REEL_ID } from "../../engine/remotion/compositionId.js";
import { stylesWithLayout } from "../../engine/remotion/styles/layouts.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { type ReelDeps, hookExamples, reelSegments, renderHookReel } from "../../engine/src/cli/reel.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { RenderJob } from "../../engine/src/render/renderVideo.js";

const hooksMd = readFileSync(join(CATALOG_DIR, "hooks.md"), "utf8");

describe("the hook reel's lines", () => {
  it("takes the first example of every ready hook, in catalog order", () => {
    const hooks = hookExamples(hooksMd);
    expect(hooks).toHaveLength(15);
    expect(hooks[0]).toEqual({ num: 1, name: "Shocking question", niche: "Animals", text: "Why do cats purr when they're hurt?" });
    expect(hooks[1]).toEqual({ num: 2, name: "Absurd number", niche: "Nature", text: "Twenty quadrillion ants are alive right now." });
    expect(hooks.map((h) => h.num)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    for (const h of hooks) expect(h.text, `hook ${h.num}`).not.toMatch(/^"|"$/);
  });

  it("skips a hook that isn't ready", () => {
    const md = "## 01 One\n\n**Status:** ready\n\n- Examples:\n  - A: \"First.\"\n\n## 02 Two\n\n**Status:** planned\n\n- Examples:\n  - B: \"Second.\"\n";
    expect(hookExamples(md).map((h) => h.num)).toEqual([1]);
  });
});

describe("the hook reel's timing", () => {
  const hooks = hookExamples(hooksMd).slice(0, 3);

  it("gives each line at least 2.5 s, or its speech plus a breath, back to back", () => {
    const segments = reelSegments(hooks, [1.2, 3.1, 2.0], [1, 3], 30);
    expect(segments.map((s) => [s.fromFrame, s.durationInFrames])).toEqual([
      [0, 75],
      [75, 111],
      [186, 78],
    ]);
  });

  it("shows the lines in each style in turn, labelled with the hook", () => {
    const segments = reelSegments(hooks, [1, 1, 1], [1, 3], 30);
    expect(segments.map((s) => s.style)).toEqual([1, 3, 1]);
    expect(segments[0]).toMatchObject({ text: hooks[0]!.text, label: "Hook 01 · Shocking question" });
  });
});

describe("unfaced reel hooks", () => {
  it("records every line, then renders one video with the voice under it", async () => {
    const rendered: RenderJob[] = [];
    const spoken: string[] = [];
    const deps: ReelDeps = {
      catalog: Catalog.load(CATALOG_DIR),
      speak: async (text) => {
        spoken.push(text);
        return { samples: new Float32Array(24000), rate: 24000 };
      },
      renderMedia: async (job) => void rendered.push(job),
      log: () => {},
    };
    const out = join("some where", "hook-reel.mp4");
    await renderHookReel({ out }, deps);
    expect(spoken).toEqual(hookExamples(hooksMd).map((h) => h.text));
    expect(rendered).toHaveLength(1);
    const job = rendered[0]!;
    expect(job).toMatchObject({ id: HOOK_REEL_ID, outPath: out, files: ["voice.wav"] });
    const { segments, audioSrc } = job.inputProps as { segments: { style: number }[]; audioSrc: string };
    expect(audioSrc).toBe("voice.wav");
    expect(segments).toHaveLength(15);
    expect(new Set(segments.map((s) => s.style))).toEqual(new Set(stylesWithLayout()));
  });
});
