import { readFileSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";

/** Quiet added before the first word, so it never starts right at the edge of the video. */
export const LEAD_IN_MS = 250;

/** Where a voice-over is brought before rendering: the middle of the −16…−12 LUFS range, with headroom under −1 dBTP. */
export const TARGET_LUFS = -14;
export const TARGET_TRUE_PEAK = -1.5;

/** The sample rate in a WAV file's fmt chunk. */
function wavSampleRate(file: string): number {
  const wav = readFileSync(file);
  for (let at = 12; at + 8 <= wav.length; at += 8 + wav.readUInt32LE(at + 4) + (wav.readUInt32LE(at + 4) % 2)) {
    if (wav.toString("ascii", at, at + 4) === "fmt ") return wav.readUInt32LE(at + 12);
  }
  throw new Error(`${file} is not a WAV file with a fmt chunk`);
}

/**
 * Rewrites a WAV voice-over with a short lead-in of quiet and at the target loudness
 * (EBU R128), keeping its sample rate.
 * The true-peak ceiling wins over the loudness target, so short or very peaky speech
 * can land a little under it, still inside the −16…−12 LUFS range.
 */
export async function prepareVoice(wavPath: string): Promise<void> {
  const file = resolve(wavPath);
  const tmp = `${file}.prepared.wav`;
  await runFfmpeg(["-v", "error", "-i", file, "-af", `adelay=${LEAD_IN_MS}:all=1,loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=11`, "-ar", String(wavSampleRate(file)), "-c:a", "pcm_s16le", "-y", tmp]);
  renameSync(tmp, file);
}
