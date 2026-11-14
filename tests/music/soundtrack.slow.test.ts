import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOUDNESS_RANGE, MAX_TRUE_PEAK, measureLoudness } from "../../engine/src/check/audio.js";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";
import { MOODS } from "../../engine/src/music/moods.js";
import { writeSoundtrack } from "../../engine/src/music/soundtrack.js";

const LENGTHS = [15, 30, 60];

/** Encodes a soundtrack the way Remotion does for the MP4: 48 kHz, libfdk_aac at 320 kb/s, cut at 18 kHz. */
async function encodeAac(wav: string): Promise<string> {
  const aac = wav.replace(/\.wav$/, ".aac");
  await runFfmpeg(["-v", "error", "-i", wav, "-ar", "48000", "-c:a", "libfdk_aac", "-b:a", "320k", "-cutoff", "18000", "-f", "adts", "-y", aac]);
  return aac;
}

// Real ffmpeg, and the render's own AAC encode. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("music-only soundtracks after the AAC encode (slow)", () => {
  it.each(MOODS.flatMap((mood) => LENGTHS.map((sec) => [mood, sec])))("music %i for %i s stays half a dB under the true-peak limit, at the platforms' loudness", async (mood, sec) => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced soundtrack "));
    await writeSoundtrack(dir, { mood, durationSec: sec });
    const { integratedLufs, truePeakDb } = await measureLoudness(await encodeAac(join(dir, "soundtrack.wav")));
    expect(truePeakDb).toBeLessThanOrEqual(MAX_TRUE_PEAK - 0.5);
    expect(integratedLufs).toBeGreaterThanOrEqual(LOUDNESS_RANGE[0]);
    expect(integratedLufs).toBeLessThanOrEqual(LOUDNESS_RANGE[1]);
  }, 120_000);
});
