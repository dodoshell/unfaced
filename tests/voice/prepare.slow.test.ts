import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOUDNESS_RANGE, MAX_TRUE_PEAK, measureLoudness } from "../../engine/src/check/audio.js";
import { LEAD_IN_MS, prepareVoice } from "../../engine/src/voice/prepare.js";
import { readWavFile, speechOnsets } from "../../engine/src/audio/speech.js";
import { readWave } from "sherpa-onnx-node";

// Real ffmpeg on a real voice-over. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("voice preparation (slow)", () => {
  it("adds a quarter second of quiet before the first word, and brings a quiet voice-over (−23.7 LUFS) into −16…−12 LUFS with its true peak under −1 dBTP, keeping its sample rate", async () => {
    const wav = join(mkdtempSync(join(tmpdir(), "unfaced voice è ")), "voice.wav");
    copyFileSync(join(import.meta.dirname, "..", "fixtures", "audio", "hello.wav"), wav);

    const original = readWavFile(wav);
    const before = speechOnsets(original)[0]!;
    const seconds = await prepareVoice(wav);
    const prepared = readWavFile(wav);
    expect(seconds).toBe(prepared.samples.length / prepared.rate);
    expect(seconds).toBeCloseTo(original.samples.length / original.rate + LEAD_IN_MS / 1000, 2);

    const { integratedLufs, truePeakDb } = await measureLoudness(wav);
    expect(integratedLufs).toBeGreaterThanOrEqual(LOUDNESS_RANGE[0]);
    expect(integratedLufs).toBeLessThanOrEqual(LOUDNESS_RANGE[1]);
    expect(truePeakDb).toBeLessThanOrEqual(MAX_TRUE_PEAK);
    expect(readWave(wav).sampleRate).toBe(24000);
    expect(Math.abs(speechOnsets(readWavFile(wav))[0]! - (before + LEAD_IN_MS))).toBeLessThanOrEqual(20);
  }, 120_000);
});
