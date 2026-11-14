import { describe, expect, it } from "vitest";
import { parseWav, speechAt, speechOnsets, speechPauses } from "../../engine/src/audio/speech.js";
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
