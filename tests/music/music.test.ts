import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { encodeWav, parseWav, speechOnsets } from "../../engine/src/audio/speech.js";
import { checkEdges } from "../../engine/src/check/sync.js";
import { MOODS, renderMusic } from "../../engine/src/music/moods.js";
import { mixSoundtrack } from "../../engine/src/music/mix.js";
import { RATE, tones } from "../audio/tones.js";

const rms = (s: Float32Array, from = 0, to = s.length) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += s[i]! ** 2;
  return Math.sqrt(sum / Math.max(1, to - from));
};
const db = (x: number) => 20 * Math.log10(x);

describe("music moods", () => {
  it("renders every mood at the requested length, audible and never clipping", () => {
    for (const mood of MOODS) {
      const music = renderMusic(mood, 6, RATE);
      expect(music.length, `mood ${mood}`).toBe(6 * RATE);
      expect(rms(music), `mood ${mood}`).toBeGreaterThan(0.02);
      expect(Math.max(...music.map(Math.abs)), `mood ${mood}`).toBeLessThanOrEqual(1);
      expect(music.every(Number.isFinite), `mood ${mood}`).toBe(true);
    }
  });

  it("is the same every time, and different for every mood", () => {
    expect(renderMusic(4, 3, RATE)).toEqual(renderMusic(4, 3, RATE));
    const prints = MOODS.map((m) => Array.from(renderMusic(m, 3, RATE).subarray(RATE, RATE + 400)).join(","));
    expect(new Set(prints).size).toBe(MOODS.length);
  });

  it("rejects a mood that has no music", () => {
    expect(() => renderMusic(8, 3, RATE)).toThrow(/music 8/);
  });
});

describe("mixSoundtrack", () => {
  // Speech from 0.25 s with short pauses, then a long gap, as a voice-over would have.
  const voice = tones(6000, [
    [250, 1200],
    [1450, 2600],
    [4200, 5400],
  ]);

  it("keeps the music well under the voice, so the voice is still found where it starts", () => {
    const music = renderMusic(4, 6.5, RATE);
    const mix = mixSoundtrack(music, RATE, voice);
    expect(mix.length).toBe(music.length);
    expect(speechOnsets({ samples: mix, rate: RATE })).toEqual(speechOnsets(voice));
    // Under the speech the music is at least 25 dB below the voice.
    const under = rms(Float32Array.from(mix.subarray(0.5 * RATE, 1.1 * RATE), (m, i) => m - voice.samples[0.5 * RATE + i]!));
    expect(db(under) - db(rms(voice.samples, 0.5 * RATE, 1.1 * RATE))).toBeLessThan(-25);
  });

  it("brings the music up in long gaps between sentences", () => {
    const mix = mixSoundtrack(renderMusic(4, 6.5, RATE), RATE, voice);
    const inGap = rms(mix, 3.3 * RATE, 3.9 * RATE);
    const underSpeech = rms(Float32Array.from(mix.subarray(0.5 * RATE, 1.1 * RATE), (m, i) => m - voice.samples[0.5 * RATE + i]!));
    expect(db(inGap) - db(underSpeech)).toBeGreaterThan(3);
  });

  it("fades in and out, so nothing sounds cut at the edges", () => {
    const mix = mixSoundtrack(renderMusic(2, 6.5, RATE), RATE, voice);
    expect(checkEdges({ samples: mix, rate: RATE })).toEqual([]);
    const textOnly = mixSoundtrack(renderMusic(2, 4, RATE), RATE);
    expect(rms(textOnly, 0, 0.08 * RATE)).toBeLessThan(0.01 * rms(textOnly));
    expect(rms(textOnly, textOnly.length - 0.08 * RATE)).toBeLessThan(0.01 * rms(textOnly));
  });

  it("keeps the music going to the very edges of a looping video, with only a click-free touch of fade", () => {
    const loop = mixSoundtrack(renderMusic(4, 4, RATE), RATE, undefined, { loop: true });
    expect(rms(loop, 0.05 * RATE, 0.25 * RATE)).toBeGreaterThan(0.3 * rms(loop));
    expect(rms(loop, loop.length - 0.25 * RATE, loop.length - 0.05 * RATE)).toBeGreaterThan(0.3 * rms(loop));
    expect(Math.abs(loop[0]!)).toBeLessThan(0.01);
    expect(Math.abs(loop.at(-1)!)).toBeLessThan(0.01);
  });
});

describe("encodeWav", () => {
  it("writes 16-bit mono PCM that reads back the same", () => {
    const samples = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i / 10) * 0.5);
    const back = parseWav(encodeWav({ samples, rate: 24000 }));
    expect(back.rate).toBe(24000);
    expect(back.samples.length).toBe(1000);
    for (let i = 0; i < 1000; i += 97) expect(back.samples[i]).toBeCloseTo(samples[i]!, 3);
  });
});
