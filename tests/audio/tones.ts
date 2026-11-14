import type { Pcm } from "../../engine/src/audio/speech.js";

export const RATE = 16000;

/** Mono audio: silence with a 220 Hz tone during each [startMs, endMs) span. */
export function tones(durationMs: number, spans: Array<[number, number]>): Pcm {
  const samples = new Float32Array((durationMs * RATE) / 1000);
  for (const [from, to] of spans) {
    for (let i = (from * RATE) / 1000; i < (to * RATE) / 1000; i++) samples[i] = 0.5 * Math.sin((2 * Math.PI * 220 * i) / RATE);
  }
  return { samples, rate: RATE };
}
