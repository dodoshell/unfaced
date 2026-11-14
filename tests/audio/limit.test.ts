import { describe, expect, it } from "vitest";
import { limitPeaks } from "../../engine/src/audio/limit.js";

const RATE = 24000;
/** A quiet tone (0.3) with full-scale spikes of 1 ms every quarter second. */
function spiky(seconds: number): Float32Array {
  const samples = new Float32Array(RATE * seconds);
  for (let i = 0; i < samples.length; i++) samples[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / RATE);
  for (let at = RATE / 8; at < samples.length; at += RATE / 4) samples.fill(-0.99, at, at + RATE / 1000);
  return samples;
}

describe("limitPeaks", () => {
  it("never lets a sample past the ceiling", () => {
    const out = limitPeaks(spiky(2), RATE, 0.5);
    expect(Math.max(...out.map(Math.abs))).toBeLessThanOrEqual(0.5);
  });

  it("leaves a signal that stays under the ceiling as it is", () => {
    const quiet = spiky(1).map((s) => s * 0.4);
    expect(limitPeaks(quiet, RATE, 0.5)).toEqual(quiet);
  });

  it("turns the gain down before a peak and back up after it, gradually rather than in one sample", () => {
    const input = spiky(1);
    const out = limitPeaks(input, RATE, 0.5);
    const gain = (i: number) => out[i]! / input[i]!;
    const spike = RATE / 8;
    // The tone just before the spike is already being turned down, and back to full a while after.
    expect(Math.abs(gain(spike - 30))).toBeLessThan(0.99);
    expect(gain(spike + RATE / 10)).toBeCloseTo(1, 6);
    // No step in the gain bigger than a tenth of the reduction the spike needs (0.5 / 0.99).
    for (let i = spike - 300; i < spike + 1500; i++) {
      if (Math.abs(input[i]!) < 0.05 || Math.abs(input[i + 1]!) < 0.05) continue;
      expect(Math.abs(gain(i + 1) - gain(i)), `sample ${i}`).toBeLessThan(0.05);
    }
  });
});
