import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { encodeWav, parseWav, readSoundtrack, speechAt, speechOnsets, speechPauses } from "../../engine/src/audio/speech.js";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";
import { RATE, tones } from "./tones.js";

/** A 16-bit mono WAV file holding `samples`. */
function wav(samples: Float32Array, dataSize = samples.length * 2): Buffer {
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + samples.length * 2, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(RATE, 24);
  out.writeUInt32LE(RATE * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(dataSize, 40);
  samples.forEach((v, i) => out.writeInt16LE(Math.round(v * 32767), 44 + i * 2));
  return out;
}

describe("speech in audio", () => {
  it("finds where speech starts after each pause", () => {
    const onsets = speechOnsets(tones(3000, [[300, 900], [1000, 1200], [1600, 2500]]));
    // 1000 follows a pause of only 100 ms, so it is part of the same phrase.
    expect(onsets).toEqual([300, 1600]);
  });

  it("gives each pause before speech, from the end of the speech before (or the start) to the onset", () => {
    expect(speechPauses(tones(3000, [[300, 900], [1000, 1200], [1600, 2500]]))).toEqual([
      { fromMs: 0, toMs: 300 },
      { fromMs: 1200, toMs: 1600 },
    ]);
  });

  it("also finds shorter pauses when asked to", () => {
    expect(speechPauses(tones(3000, [[300, 900], [1000, 1200], [1600, 2500]]), 100)).toEqual([
      { fromMs: 0, toMs: 300 },
      { fromMs: 900, toMs: 1000 },
      { fromMs: 1200, toMs: 1600 },
    ]);
  });

  it("tells whether there is speech in a stretch of time", () => {
    const pcm = tones(1000, [[50, 600]]);
    expect(speechAt(pcm, 0, 80)).toBe(true);
    expect(speechAt(pcm, 920, 1000)).toBe(false);
  });

  it("finds no speech in silence", () => {
    const silence = tones(1000, []);
    expect(speechOnsets(silence)).toEqual([]);
    expect(speechAt(silence, 0, 1000)).toBe(false);
  });

  it("does not take a click of 10, 20 or 30 ms for speech starting, but takes a 40 ms sound", () => {
    for (const click of [10, 20, 30]) {
      const pcm = tones(3000, [[300, 900], [1200, 1200 + click], [1400, 2500]]);
      expect(speechOnsets(pcm), `${click} ms`).toEqual([300, 1400]);
      expect(speechPauses(pcm).at(-1), `${click} ms`).toEqual({ fromMs: 900, toMs: 1400 });
      expect(speechAt(pcm, 1150, 1250), `${click} ms`).toBe(false);
    }
    expect(speechOnsets(tones(3000, [[300, 900], [1200, 1240], [1400, 2500]]))).toEqual([300, 1200, 1400]);
  });

  it("hears one pause through the 20-30 ms pulses the free voice leaves between paragraphs", () => {
    const pcm = tones(3000, [[300, 900], [1020, 1050], [1170, 1190], [1340, 1370], [1500, 2500]]);
    expect(speechPauses(pcm).at(-1)).toEqual({ fromMs: 900, toMs: 1500 });
  });

  it("hears a video's soundtrack in full, so an 's' above 8 kHz between two vowels is not a pause", async () => {
    // At 24 kHz like the voice-over: a vowel, 150 ms of hiss at 9-11 kHz, a vowel.
    const rate = 24000;
    const samples = new Float32Array(rate * 2);
    for (let i = 0; i < samples.length; i++) {
      const ms = (i / rate) * 1000;
      const t = i / rate;
      if ((ms >= 400 && ms < 1000) || (ms >= 1150 && ms < 1600)) samples[i] = 0.5 * Math.sin(2 * Math.PI * 220 * t);
      else if (ms >= 1000 && ms < 1150) samples[i] = 0.12 * [9000, 9700, 10300, 11000].reduce((sum, f) => sum + Math.sin(2 * Math.PI * f * t), 0);
    }
    const dir = mkdtempSync(join(tmpdir(), "unfaced soundtrack "));
    writeFileSync(join(dir, "voice.wav"), encodeWav({ samples, rate }));
    await runFfmpeg(["-v", "error", "-i", join(dir, "voice.wav"), "-c:a", "aac", "-b:a", "192k", "-y", join(dir, "video.mp4")]);
    expect(speechOnsets(await readSoundtrack(join(dir, "video.mp4")))).toEqual([400]);
  });

  it("reads a 16-bit WAV, also one piped by ffmpeg with an unknown data size", () => {
    const { samples } = tones(100, [[0, 100]]);
    for (const size of [samples.length * 2, 0xffffffff]) {
      const pcm = parseWav(wav(samples, size));
      expect(pcm.rate).toBe(RATE);
      expect(pcm.samples.length).toBe(samples.length);
      expect(pcm.samples[40]).toBeCloseTo(samples[40]!, 3);
    }
  });
});
