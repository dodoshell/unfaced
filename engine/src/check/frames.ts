import { resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";
import { type CheckIssue, frameMs } from "./types.js";

/** Frames are compared as small greyscale images: enough to see motion, cheap to read. */
const GRAY_W = 72;
const GRAY_H = 128;

/** A run of this many black or identical frames (half a second at 30 fps) is an error. */
export const MIN_RUN = 15;
/** A frame is black when nearly all its pixels are darker than this (0–255). */
const BLACK_LEVEL = 32;
const BLACK_SHARE = 0.98;
/** Two frames are identical when no pixel differs by more than this (encoder noise). */
const SAME_DIFF = 4;

/** Decodes every frame of a video as a 72×128 greyscale image. */
export async function readGrayFrames(video: string): Promise<Uint8Array[]> {
  const size = GRAY_W * GRAY_H;
  const { stdout } = await runFfmpeg(["-v", "error", "-i", resolve(video), "-vf", `scale=${GRAY_W}:${GRAY_H},format=gray`, "-c:v", "rawvideo", "-f", "image2pipe", "-"]);
  return Array.from({ length: Math.floor(stdout.length / size) }, (_, i) => new Uint8Array(stdout.subarray(i * size, (i + 1) * size)));
}

const isBlack = (frame: Uint8Array): boolean => frame.filter((v) => v <= BLACK_LEVEL).length >= frame.length * BLACK_SHARE;

function isSame(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i]! - b[i]!) > SAME_DIFF) return false;
  return true;
}

/** Start and length of every run of `true`. */
function runs(flags: boolean[]): Array<[start: number, length: number]> {
  const found: Array<[number, number]> = [];
  flags.forEach((flag, i) => {
    if (!flag) return;
    const current = found.at(-1);
    if (current && current[0] + current[1] === i) current[1]++;
    else found.push([i, 1]);
  });
  return found;
}

const seconds = (frames: number, fps: number) => (frames / fps).toFixed(1);

/** Reports runs of black frames and runs of frames where nothing moves. */
export function checkFrames(frames: Uint8Array[], fps: number): CheckIssue[] {
  const black = frames.map(isBlack);
  const issues: CheckIssue[] = [];
  for (const [start, length] of runs(black)) {
    if (length < MIN_RUN) continue;
    issues.push({ check: "black-frame", atMs: frameMs(start, fps), severity: "error", message: `The picture is black for ${length} frames (${seconds(length, fps)} s)` });
  }
  // A frame continues a still run when it matches the one before; black runs are reported above.
  const still = frames.map((frame, i) => i > 0 && !black[i] && !black[i - 1] && isSame(frame, frames[i - 1]!));
  for (const [start, length] of runs(still)) {
    const total = length + 1;
    if (total < MIN_RUN) continue;
    issues.push({ check: "frozen-frame", atMs: frameMs(start - 1, fps), severity: "error", message: `The picture stands still for ${total} frames (${seconds(total, fps)} s)` });
  }
  return issues;
}
