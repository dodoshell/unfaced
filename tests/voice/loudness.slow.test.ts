import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOUDNESS_RANGE, MAX_TRUE_PEAK, measureLoudness } from "../../engine/src/check/audio.js";
import { normalizeLoudness } from "../../engine/src/voice/loudness.js";
import { readWave } from "sherpa-onnx-node";

// Real ffmpeg on a real voice-over. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("voice loudness (slow)", () => {
  it("brings a quiet voice-over (−23.7 LUFS) into −16…−12 LUFS with its true peak under −1 dBTP, keeping its sample rate", async () => {
    const wav = join(mkdtempSync(join(tmpdir(), "unfaced loudness è ")), "voice.wav");
    copyFileSync(join(import.meta.dirname, "..", "fixtures", "audio", "hello.wav"), wav);

    await normalizeLoudness(wav);

    const { integratedLufs, truePeakDb } = await measureLoudness(wav);
    expect(integratedLufs).toBeGreaterThanOrEqual(LOUDNESS_RANGE[0]);
    expect(integratedLufs).toBeLessThanOrEqual(LOUDNESS_RANGE[1]);
    expect(truePeakDb).toBeLessThanOrEqual(MAX_TRUE_PEAK);
    expect(readWave(wav).sampleRate).toBe(24000);
  }, 120_000);
});
