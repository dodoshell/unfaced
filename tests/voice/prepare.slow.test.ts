import { copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOUDNESS_RANGE, MAX_TRUE_PEAK, measureLoudness } from "../../engine/src/check/audio.js";
import { LEAD_IN_MS, prepareVoice, TARGET_LUFS } from "../../engine/src/voice/prepare.js";
import { encodeWav, readWavFile, speechOnsets } from "../../engine/src/audio/speech.js";
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

  it("brings a voice-over with sharp peaks to the target loudness itself, not just inside the range", async () => {
    // Twelve seconds of speech whose plosives peak near full scale while the words stay quiet:
    // the true-peak ceiling used to stop a single loudnorm pass around −16 LUFS.
    const hello = readWavFile(join(import.meta.dirname, "..", "fixtures", "audio", "hello.wav"));
    const samples = new Float32Array(hello.rate * 12);
    for (let i = 0; i < samples.length; i++) samples[i] = hello.samples[i % hello.samples.length]! * 0.5;
    for (let at = hello.rate / 4; at < samples.length; at += hello.rate / 3) samples.fill(0.98, at, at + 24);
    const wav = join(mkdtempSync(join(tmpdir(), "unfaced voice ")), "voice.wav");
    writeFileSync(wav, encodeWav({ samples, rate: hello.rate }));

    await prepareVoice(wav);
    const { integratedLufs, truePeakDb } = await measureLoudness(wav);
    expect(Math.abs(integratedLufs - TARGET_LUFS), `${integratedLufs} LUFS`).toBeLessThanOrEqual(0.5);
    expect(truePeakDb).toBeLessThanOrEqual(MAX_TRUE_PEAK);
  }, 120_000);
});
