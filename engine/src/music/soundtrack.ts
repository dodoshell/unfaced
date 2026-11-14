import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodeWav, readWavFile } from "../audio/speech.js";
import { runFfmpeg } from "../ffmpeg.js";
import { TARGET_LUFS, TARGET_TRUE_PEAK } from "../voice/prepare.js";
import { mixSoundtrack } from "./mix.js";
import { renderMusic } from "./moods.js";

/** Sample rate of a soundtrack without a voice-over. */
const MUSIC_RATE = 44100;

export const SOUNDTRACK = "soundtrack.wav";

export interface SoundtrackRequest {
  /** A music mood from the catalog (1–7). */
  mood: number;
  durationSec: number;
  /** The prepared voice-over, if the video has one. */
  voiceWav?: string;
  /** The video loops (ending 01), so the music runs to the cut. */
  loop?: boolean;
}

/**
 * Makes `<videoDir>/soundtrack.wav`: the music mood under the voice-over (which is
 * already at the target loudness), or the music alone brought to the target loudness.
 */
export async function writeSoundtrack(videoDir: string, { mood, durationSec, voiceWav, loop = false }: SoundtrackRequest): Promise<string> {
  const voice = voiceWav ? readWavFile(voiceWav) : undefined;
  const rate = voice?.rate ?? MUSIC_RATE;
  const samples = mixSoundtrack(renderMusic(mood, durationSec, rate), rate, voice, { loop });
  const file = join(videoDir, SOUNDTRACK);
  writeFileSync(file, encodeWav({ samples, rate }));
  if (!voice) {
    const tmp = `${file}.loud.wav`;
    await runFfmpeg(["-v", "error", "-i", file, "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=11`, "-ar", String(rate), "-c:a", "pcm_s16le", "-y", tmp]);
    renameSync(tmp, file);
  }
  return SOUNDTRACK;
}
