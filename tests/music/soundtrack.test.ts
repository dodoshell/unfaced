import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { durationMs, encodeWav, readWavFile, speechOnsets } from "../../engine/src/audio/speech.js";
import { LOUDNESS_RANGE, MAX_TRUE_PEAK, measureLoudness } from "../../engine/src/check/audio.js";
import { writeSoundtrack } from "../../engine/src/music/soundtrack.js";
import { tones } from "../audio/tones.js";

describe("writeSoundtrack", () => {
  it("brings a music-only soundtrack to the platforms' loudness", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced soundtrack "));
    expect(await writeSoundtrack(dir, { mood: 3, durationSec: 6 })).toBe("soundtrack.wav");
    const file = join(dir, "soundtrack.wav");
    const pcm = readWavFile(file);
    expect(pcm.rate).toBe(44100);
    expect(durationMs(pcm)).toBeCloseTo(6000, -2);
    const { integratedLufs, truePeakDb } = await measureLoudness(file);
    expect(integratedLufs).toBeGreaterThanOrEqual(LOUDNESS_RANGE[0]);
    expect(integratedLufs).toBeLessThanOrEqual(LOUDNESS_RANGE[1]);
    expect(truePeakDb).toBeLessThanOrEqual(MAX_TRUE_PEAK);
  });

  it("keeps the voice-over's rate and its speech onsets under the music", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced soundtrack "));
    const voice = tones(5000, [[400, 1600], [2200, 3400], [4000, 4600]]);
    writeFileSync(join(dir, "voice.wav"), encodeWav(voice));
    await writeSoundtrack(dir, { mood: 4, durationSec: 5, voiceWav: join(dir, "voice.wav") });
    const pcm = readWavFile(join(dir, "soundtrack.wav"));
    expect(pcm.rate).toBe(voice.rate);
    expect(speechOnsets(pcm)).toEqual(speechOnsets(voice));
  });
});
