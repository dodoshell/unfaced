import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { VideoPlan } from "../plan/types.js";
import { ownScenes } from "../render/ownScenes.js";
import { renderStillAt } from "../render/renderVideo.js";

/** The cover's frame: `atSec` if given (kept inside the video), else one second into the hook, when its title is on screen. */
export function coverFrame(plan: VideoPlan, atSec?: number): number {
  if (atSec !== undefined) return Math.min(plan.durationInFrames - 1, Math.max(0, Math.round(atSec * plan.fps)));
  const hook = plan.scenes[0];
  return Math.min(plan.fps, (hook?.durationInFrames ?? plan.durationInFrames) - 1);
}

/**
 * Renders `<videoDir>/cover.png` (1080×1920): one frame of the made video without captions,
 * which the platforms show in the grid and before the video plays.
 */
export async function makeCover(videoDir: string, atSec?: number, render: typeof renderStillAt = renderStillAt, log: (m: string) => void = console.error): Promise<string> {
  const dir = resolve(videoDir);
  const planFile = join(dir, "plan.json");
  if (!existsSync(planFile)) throw new Error(`plan.json not found in ${dir}; run "unfaced make" on this folder first`);
  const plan = JSON.parse(readFileSync(planFile, "utf8")) as VideoPlan;
  const still: VideoPlan = { ...plan, scenes: plan.scenes.map((s) => ({ ...s, words: [] })) };
  const scenes = ownScenes(dir, plan.scenes.map((s) => s.beatId), log);
  const out = join(dir, "cover.png");
  await render(still, coverFrame(plan, atSec), out, { assetsDir: dir, ...(scenes ? { scenes } : {}) });
  return out;
}
