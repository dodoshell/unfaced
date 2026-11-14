import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodeWav, readWavFile } from "../audio/speech.js";
import { runFfmpeg } from "../ffmpeg.js";
import { TARGET_LUFS } from "../voice/prepare.js";
import { mixSoundtrack } from "./mix.js";
import { renderLoopingMusic, renderMusic } from "./moods.js";

/** Sample rate of a soundtrack without a voice-over. */
const MUSIC_RATE = 44100;

/** Music alone aims under the voice-over's ceiling: loudnorm's is not a hard limit, and the AAC encode raises the peaks. */
const MUSIC_TRUE_PEAK = -2;
/** Resampling through this rate drops what lies above 16 kHz, which the AAC encode would cut after loudnorm, raising the peaks. */
const BAND_LIMIT_RATE = 32000;

export const SOUNDTRACK = "soundtrack.wav";

export interface SoundtrackRequest {
  /** A music mood from the catalog (1–7). */
  mood: number;
  durationSec: number;
  /** The prepared voice-over, if the video has one. */
  voiceWav?: string;
  /** The video loops, so the music runs to the cut and on into its start. */
  loop?: boolean;
}

/**
 * Makes `<videoDir>/soundtrack.wav`: the music mood under the voice-over (which is
 * already at the target loudness), or the music alone brought to the target loudness.
 */
export async function writeSoundtrack(videoDir: string, { mood, durationSec, voiceWav, loop = false }: SoundtrackRequest): Promise<string> {
  const voice = voiceWav ? readWavFile(voiceWav) : undefined;
  const rate = voice?.rate ?? MUSIC_RATE;
  const music = loop ? renderLoopingMusic(mood, durationSec, rate) : renderMusic(mood, durationSec, rate);
  const samples = mixSoundtrack(music, rate, voice, { loop });
  const file = join(videoDir, SOUNDTRACK);
  writeFileSync(file, encodeWav({ samples, rate }));
  if (!voice) {
    const tmp = `${file}.loud.wav`;
    const filters = `aresample=${BAND_LIMIT_RATE},aresample=${rate},loudnorm=I=${TARGET_LUFS}:TP=${MUSIC_TRUE_PEAK}:LRA=11`;
    await runFfmpeg(["-v", "error", "-i", file, "-af", filters, "-ar", String(rate), "-c:a", "pcm_s16le", "-y", tmp]);
    renameSync(tmp, file);
  }
  return SOUNDTRACK;
}
