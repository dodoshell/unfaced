import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { drawsEndingMark, getLayout } from "../../remotion/styles/layouts.js";
import { type Pcm, readSoundtrack, speechOnsets } from "../audio/speech.js";
import { type Loudness, checkLoudness, measureLoudness } from "../check/audio.js";
import { checkFrames, readGrayFrames } from "../check/frames.js";
import { checkPost } from "../check/post.js";
import { checkOverlap, checkSafeZone, placedBoxes } from "../check/overlap.js";
import { captionedOnsets, checkEdges, checkSync, shownWords } from "../check/sync.js";
import { type CheckReport, toReport } from "../check/types.js";
import type { VideoPlan } from "../plan/types.js";
import type { PostPlan } from "../post/buildPostPlan.js";
import { readOwnBoxes } from "../render/ownScenes.js";
import { TEXT_ONLY_VOICE } from "../catalog/special.js";

export interface CheckDeps {
  readFrames(video: string): Promise<Uint8Array[]>;
  measureLoudness(video: string): Promise<Loudness>;
  readSoundtrack(video: string): Promise<Pcm>;
}

export const defaultCheckDeps = (): CheckDeps => ({ readFrames: readGrayFrames, measureLoudness, readSoundtrack });

/**
 * Runs every automatic check on a made video (plan.json and video.mp4 in
 * `videoDir`) and writes the report to `<videoDir>/check.json`.
 */
export async function checkVideo(videoDir: string, deps: CheckDeps = defaultCheckDeps()): Promise<CheckReport> {
  const dir = resolve(videoDir);
  for (const file of ["plan.json", "video.mp4"]) {
    if (!existsSync(join(dir, file))) throw new Error(`${file} not found in ${dir}; run "unfaced make" on this folder first`);
  }
  const plan = JSON.parse(readFileSync(join(dir, "plan.json"), "utf8")) as VideoPlan;
  const video = join(dir, "video.mp4");

  const boxes = placedBoxes(plan, getLayout(plan.style), drawsEndingMark(plan.style), readOwnBoxes(join(dir, "scenes", "boxes.json")));
  // A text-only video (voice 08) has no voice to follow; a silent one has no sound to measure.
  const voiced = plan.voice !== TEXT_ONLY_VOICE && plan.audioSrc !== undefined;
  const soundtrack = voiced ? await deps.readSoundtrack(video) : undefined;
  const report = toReport([
    ...checkOverlap(boxes, plan.fps),
    ...checkSafeZone(boxes, plan.fps),
    ...(soundtrack ? checkSync(shownWords(plan), captionedOnsets(plan, speechOnsets(soundtrack)), plan.fps) : []),
    ...(soundtrack ? checkEdges(soundtrack) : []),
    ...checkFrames(await deps.readFrames(video), plan.fps),
    ...(plan.audioSrc !== undefined ? checkLoudness(await deps.measureLoudness(video)) : []),
  ]);
  writeFileSync(join(dir, "check.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/**
 * Runs a made post's checks again from `<postDir>/post-plan.json` (one plan per format) and
 * writes `<postDir>/check.json`. `unfaced check` calls this for a folder with slides.md.
 */
export function checkPostDir(postDir: string): CheckReport {
  const dir = resolve(postDir);
  const file = join(dir, "post-plan.json");
  if (!existsSync(file)) throw new Error(`post-plan.json not found in ${dir}; run "unfaced post" on this folder first`);
  const plans = JSON.parse(readFileSync(file, "utf8")) as PostPlan[];
  const report = toReport(plans.flatMap(checkPost));
  writeFileSync(join(dir, "check.json"), `${JSON.stringify(report, null, 2)}
`);
  return report;
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/** m:ss.t */
function clock(ms: number): string {
  const tenths = Math.floor(ms / 100);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, "0")}`;
}

/** A verdict line, then one line per issue; a post's issues have no time (they name their slide). */
export function summaryLines(report: CheckReport, { times = true }: { times?: boolean } = {}): string[] {
  const errors = report.issues.filter((i) => i.severity === "error").length;
  const warnings = report.issues.length - errors;
  return [
    `Checks: ${report.pass ? "PASS" : "FAIL"} (${count(errors, "error")}, ${count(warnings, "warning")})`,
    ...report.issues.map((i) => `  ${i.severity.padEnd(7)} ${times ? `${clock(i.atMs)}  ` : ""}${i.check}  ${i.message}`),
  ];
}
