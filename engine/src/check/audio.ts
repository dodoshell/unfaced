import { resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";
import type { CheckIssue } from "./types.js";

export interface Loudness {
  /** Integrated loudness over the whole video, in LUFS. */
  integratedLufs: number;
  /** True peak, in dBTP. */
  truePeakDb: number;
}

/** The platforms' target: integrated loudness in this range, true peak at or under −1 dBTP. */
export const LOUDNESS_RANGE = [-16, -12] as const;
export const MAX_TRUE_PEAK = -1;

export function checkLoudness({ integratedLufs, truePeakDb }: Loudness): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const [low, high] = LOUDNESS_RANGE;
  if (!Number.isFinite(integratedLufs)) {
    issues.push({ check: "loudness", atMs: 0, severity: "warning", message: "The soundtrack is silent" });
  } else if (integratedLufs < low || integratedLufs > high) {
    issues.push({ check: "loudness", atMs: 0, severity: "warning", message: `Loudness is ${integratedLufs.toFixed(1)} LUFS; aim for ${low} to ${high} LUFS` });
  }
  if (truePeakDb > MAX_TRUE_PEAK) {
    issues.push({ check: "clipping", atMs: 0, severity: "error", message: `True peak is ${truePeakDb.toFixed(1)} dBTP, over the ${MAX_TRUE_PEAK} dBTP limit, so it may clip` });
  }
  return issues;
}

/** Reads the measured input values from the JSON block ffmpeg's loudnorm filter prints. */
export function parseLoudnorm(stderr: string): Loudness {
  const json = stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
  const values = JSON.parse(json) as { input_i: string; input_tp: string };
  const number = (v: string) => (v.trim() === "-inf" ? Number.NEGATIVE_INFINITY : Number(v));
  return { integratedLufs: number(values.input_i), truePeakDb: number(values.input_tp) };
}

/** Measures a file's integrated loudness and true peak (EBU R128) with ffmpeg. */
export async function measureLoudness(file: string): Promise<Loudness> {
  const { stderr } = await runFfmpeg(["-i", resolve(file), "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  return parseLoudnorm(stderr);
}
