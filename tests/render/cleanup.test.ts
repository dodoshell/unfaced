import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { describe, expect, it, vi } from "vitest";
import { closeRenders, renderMediaOf } from "../../engine/src/render/renderVideo.js";

vi.mock("@remotion/bundler", () => ({ bundle: vi.fn() }));

describe("cleaning up after a render", () => {
  it("deletes the staged files, the scenes entry and the bundle's folder even when bundling fails", async () => {
    // A video's scene code with a syntax error: webpack gives up after making its folders.
    const failing = async ({ outDir }: { outDir?: string }): Promise<string> => {
      if (outDir) mkdirSync(join(outDir, "half-written"), { recursive: true });
      throw new Error("Module parse failed: Unexpected token");
    };
    vi.mocked(bundle).mockImplementation(failing as unknown as typeof bundle);
    const video = mkdtempSync(join(tmpdir(), "unfaced cleanup "));
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "b2.png"), "png");
    writeFileSync(join(video, "scenes.tsx"), "export default {");
    const job = { id: "Video", inputProps: {}, outPath: join(video, "video.mp4"), assetsDir: video, files: ["inbox/b2.png"], scenes: join(video, "scenes.tsx") };

    await expect(renderMediaOf(job)).rejects.toThrow(/Module parse failed/);
    const outDir = (vi.mocked(bundle).mock.calls[0]![0] as { outDir?: string }).outDir;
    const removed = await closeRenders();

    expect(outDir).toBeDefined();
    expect(removed).toContain(outDir);
    expect(removed.some((d) => /unfaced-public-/.test(d))).toBe(true);
    expect(removed.some((d) => /unfaced-entry-/.test(d))).toBe(true);
    for (const dir of removed) expect(existsSync(dir), dir).toBe(false);
    expect(await closeRenders()).toEqual([]);
  });
});
