import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import type { VideoPlan } from "../plan/types.js";
import { closeRenders, renderStillAt } from "../render/renderVideo.js";

/** Parses an interval such as "1s", "0.5s" or "2" (seconds). */
export function parseEvery(value: string): number {
  const sec = Number(value.replace(/s$/, ""));
  if (!Number.isFinite(sec) || sec <= 0) throw new Error(`--every needs a duration such as 1s or 0.5s, got "${value}"`);
  return sec;
}

/**
 * Renders one PNG every `everySec` seconds of a made video into `<videoDir>/frames/`, for
 * review, replacing the frames of an earlier run. Uses the video's own scenes/ like make.
 */
export async function renderFrames(
  videoDir: string,
  everySec: number,
  log: (m: string) => void = console.error,
  render: typeof renderStillAt = renderStillAt,
): Promise<string[]> {
  const dir = resolve(videoDir);
  const planFile = join(dir, "plan.json");
  if (!existsSync(planFile)) throw new Error(`plan.json not found in ${dir}; run "unfaced make" first`);
  const plan = JSON.parse(readFileSync(planFile, "utf8")) as VideoPlan;
  const step = Math.max(1, Math.round(everySec * plan.fps));
  const files: string[] = [];
  const scenes = join(dir, "scenes", "index.tsx");
  const options = { assetsDir: dir, ...(existsSync(scenes) ? { scenes } : {}) };
  rmSync(join(dir, "frames"), { recursive: true, force: true });
  try {
    for (let frame = 0; frame < plan.durationInFrames; frame += step) {
      const file = join(dir, "frames", `frame-${String(frame).padStart(5, "0")}.png`);
      await render(plan, frame, file, options);
      files.push(file);
    }
  } finally {
    await closeRenders();
  }
  log(`Wrote ${files.length} frames to ${join(dir, "frames")}`);
  return files;
}
