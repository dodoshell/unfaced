import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderFrames } from "../../engine/src/cli/frames.js";

const example = join(import.meta.dirname, "..", "..", "examples", "pages", "curious-cats", "videos", "why-cats-purr");

function setup(): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced frames "));
  copyFileSync(join(example, "plan.json"), join(dir, "plan.json"));
  return dir;
}

const stubRender = () =>
  vi.fn(async (_plan: unknown, _frame: number, out: string) => {
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, "png");
  });

describe("unfaced frames", () => {
  it("replaces the frames of an earlier run instead of mixing them in", async () => {
    const dir = setup();
    mkdirSync(join(dir, "frames"));
    writeFileSync(join(dir, "frames", "frame-99999.png"), "old");
    const files = await renderFrames(dir, 1, () => {}, stubRender());
    expect(existsSync(join(dir, "frames", "frame-99999.png"))).toBe(false);
    expect(readdirSync(join(dir, "frames")).length).toBe(files.length);
  });

  it("renders the video's own scenes, as make does", async () => {
    const dir = setup();
    mkdirSync(join(dir, "scenes"));
    writeFileSync(join(dir, "scenes", "index.tsx"), "export default {};");
    const render = stubRender();
    await renderFrames(dir, 1, () => {}, render);
    expect(render).toHaveBeenCalledWith(expect.anything(), 0, join(dir, "frames", "frame-00000.png"), { assetsDir: dir, scenes: join(dir, "scenes", "index.tsx") });
  });

  it("stops when scenes/ has no index.tsx, as make does", async () => {
    const dir = setup();
    mkdirSync(join(dir, "scenes"));
    writeFileSync(join(dir, "scenes", "index.jsx"), "export default {};");
    const render = stubRender();
    await expect(renderFrames(dir, 1, () => {}, render)).rejects.toThrow(/no index\.tsx/);
    expect(render).not.toHaveBeenCalled();
  });
});
