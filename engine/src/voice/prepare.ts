import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { limitPeaks } from "../audio/limit.js";
import { encodeWav, parseWav, type Pcm } from "../audio/speech.js";
import { measureLoudness } from "../check/audio.js";
import { runFfmpeg } from "../ffmpeg.js";

/** Quiet added before the first word, so it never starts right at the edge of the video. */
export const LEAD_IN_MS = 250;

/** Where a voice-over is brought before rendering: the middle of the −16…−12 LUFS range, with headroom under −1 dBTP. */
export const TARGET_LUFS = -14;
export const TARGET_TRUE_PEAK = -1.5;

/**
 * Before loudnorm, the voice is raised to this far past the target and its peaks are limited to
 * −3 dBFS. On its own, loudnorm's true-peak ceiling held peaky speech back at −15 to −16 LUFS;
 * with the peaks already tamed it only trims the last decibel.
 */
const LIMITER_DRIVE_DB = 1;
const LIMITER_CEILING = 0.708;

/** The rate imported voice-overs are stored at, the same as the free voice's. */
const IMPORT_RATE = 24000;

/**
 * Converts a voice-over made elsewhere (WAV or MP3) to a mono 16-bit WAV at `wavPath`, with its
 * format named so ffmpeg never guesses one from the content. Returns its length in seconds.
 */
export async function importVoice(src: string, wavPath: string): Promise<number> {
  const format = extname(src).toLowerCase() === ".mp3" ? "mp3" : "wav";
  await runFfmpeg(["-v", "error", "-f", format, "-i", resolve(src), "-map", "0:a:0", "-ac", "1", "-ar", String(IMPORT_RATE), "-c:a", "pcm_s16le", "-y", resolve(wavPath)]);
  const { samples, rate } = parseWav(readFileSync(wavPath));
  return samples.length / rate;
}

/**
 * Rewrites a WAV voice-over with a short lead-in of quiet and at the target loudness
 * (EBU R128), keeping its sample rate: measured first, raised into a peak limiter, measured
 * again, then brought to the target by loudnorm with those measurements (a single gain when
 * the true-peak ceiling allows it, which the limiter's headroom makes the usual case).
 * Returns the prepared length in seconds, lead-in included: the length the video follows.
 */
export async function prepareVoice(wavPath: string): Promise<number> {
  const file = resolve(wavPath);
  const limited = `${file}.limited.wav`;
  const tmp = `${file}.prepared.wav`;
  const { integratedLufs } = await measureLoudness(file);
  const gain = Number.isFinite(integratedLufs) ? 10 ** ((TARGET_LUFS - integratedLufs + LIMITER_DRIVE_DB) / 20) : 1;
  const { samples, rate } = await readVoice(file);
  writeFileSync(limited, encodeWav({ samples: limitPeaks(samples.map((s) => s * gain), rate, LIMITER_CEILING), rate }));
  try {
    const target = `I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=11`;
    const { stderr } = await runFfmpeg(["-i", limited, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]);
    const m = loudnormMeasurement(stderr);
    const measured = m ? `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true` : "";
    await runFfmpeg(["-v", "error", "-i", limited, "-af", `adelay=${LEAD_IN_MS}:all=1,loudnorm=${target}${measured}`, "-ar", String(rate), "-c:a", "pcm_s16le", "-y", tmp]);
  } finally {
    rmSync(limited, { force: true });
  }
  renameSync(tmp, file);
  const prepared = parseWav(readFileSync(file));
  return prepared.samples.length / prepared.rate;
}

/** loudnorm's first-pass measurements, or nothing for silence (which has no loudness to match). */
function loudnormMeasurement(stderr: string): Record<"input_i" | "input_tp" | "input_lra" | "input_thresh" | "target_offset", string> | undefined {
  const values = JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1)) as Record<string, string>;
  const keys = ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"] as const;
  if (keys.some((k) => !Number.isFinite(Number(values[k])))) return undefined;
  return Object.fromEntries(keys.map((k) => [k, values[k]!])) as Record<(typeof keys)[number], string>;
}

/** A voice-over's samples, mono; one that isn't 16-bit PCM is converted by ffmpeg first. */
async function readVoice(file: string): Promise<Pcm> {
  try {
    return parseWav(readFileSync(file));
  } catch {
    const { stdout } = await runFfmpeg(["-v", "error", "-i", file, "-ac", "1", "-c:a", "pcm_s16le", "-f", "wav", "-"]);
    return parseWav(stdout);
  }
}
