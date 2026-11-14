// Small, deterministic synthesizers for the music moods: notes, drums, a reverb. Music made
// here is our own work (MIT), so no track needs a third-party licence.

export type Wave = "sine" | "triangle" | "saw" | "square" | "bell" | "epiano" | "marimba";

/** A seeded random number generator (mulberry32), so a mood always sounds the same. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The frequency of a MIDI note (69 = A4 = 440 Hz). */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const TAU = Math.PI * 2;

/** Partials of each wave: [frequency ratio, amplitude]. */
const PARTIALS: Record<Wave, Array<[number, number]>> = {
  sine: [[1, 1]],
  triangle: [
    [1, 1],
    [3, -1 / 9],
    [5, 1 / 25],
    [7, -1 / 49],
  ],
  saw: [1, 2, 3, 4, 5, 6].map((n) => [n, 0.6 / n] as [number, number]),
  square: [1, 3, 5, 7].map((n) => [n, 0.7 / n] as [number, number]),
  bell: [
    [1, 1],
    [2.76, 0.5],
    [5.4, 0.25],
    [8.93, 0.12],
  ],
  epiano: [
    [1, 1],
    [2, 0.35],
    [3, 0.08],
  ],
  marimba: [
    [1, 1],
    [3.93, 0.25],
    [9.2, 0.06],
  ],
};

export interface NoteOptions {
  /** Start and length in seconds. */
  at: number;
  dur: number;
  freq: number;
  gain: number;
  wave: Wave;
  /** Seconds to fade in and out. */
  attack?: number;
  release?: number;
  /** Exponential decay time in seconds (plucks, bells); none for held notes. */
  decay?: number;
  /** Vibrato depth in semitones (at 5 Hz). */
  vibrato?: number;
  /** Tremolo depth 0..1 (at 4 Hz). */
  tremolo?: number;
}

/** Adds one note to the bus. Higher partials of bells and pianos fade faster. */
export function note(bus: Float32Array, rate: number, o: NoteOptions): void {
  const start = Math.max(0, Math.round(o.at * rate));
  const end = Math.min(bus.length, Math.round((o.at + o.dur) * rate));
  const attack = o.attack ?? 0.01;
  const release = o.release ?? 0.05;
  const partials = PARTIALS[o.wave];
  const phases = partials.map(() => 0);
  for (let i = start; i < end; i++) {
    const t = (i - start) / rate;
    const left = (end - i) / rate;
    let env = Math.min(1, t / attack, left / release);
    if (o.decay) env *= Math.exp(-t / o.decay);
    if (o.tremolo) env *= 1 - o.tremolo * (0.5 + 0.5 * Math.sin(TAU * 4 * t));
    const f = o.vibrato ? o.freq * 2 ** ((o.vibrato * Math.sin(TAU * 5 * t)) / 12) : o.freq;
    let s = 0;
    for (let k = 0; k < partials.length; k++) {
      const [ratio, amp] = partials[k]!;
      phases[k]! += (TAU * f * ratio) / rate;
      const fade = o.decay && ratio > 1.5 ? Math.exp(-t * ratio * 0.8) : 1;
      s += amp * fade * Math.sin(phases[k]!);
    }
    bus[i]! += o.gain * env * s;
  }
}

/** A kick drum: a falling sine thump. */
export function kick(bus: Float32Array, rate: number, at: number, gain: number, low = 45): void {
  const start = Math.round(at * rate);
  let phase = 0;
  for (let i = start; i < Math.min(bus.length, start + Math.round(0.4 * rate)); i++) {
    const t = (i - start) / rate;
    phase += (TAU * (low + 75 * Math.exp(-t / 0.04))) / rate;
    bus[i]! += gain * Math.exp(-t / 0.16) * Math.sin(phase);
  }
}

/** Filtered noise with an exponential decay: snares, claps, hats, shakers. */
export function noiseHit(bus: Float32Array, rate: number, at: number, gain: number, decay: number, random: () => number, brightness = 1, tone = 0): void {
  const start = Math.round(at * rate);
  let prev = 0;
  let prev2 = 0;
  for (let i = start; i < Math.min(bus.length, start + Math.round(decay * 6 * rate)); i++) {
    const t = (i - start) / rate;
    const n = random() * 2 - 1;
    // Differences of white noise lean bright; brightness 0..2 picks how many.
    const hp = brightness >= 2 ? n - 2 * prev + prev2 : brightness >= 1 ? n - prev : n;
    prev2 = prev;
    prev = n;
    const body = tone ? 0.6 * Math.sin(TAU * tone * t) : 0;
    bus[i]! += gain * Math.exp(-t / decay) * (0.5 * hp + body);
  }
}

/** A deep drum boom (taiko, timpani). */
export function boom(bus: Float32Array, rate: number, at: number, gain: number, random: () => number): void {
  kick(bus, rate, at, gain, 38);
  noiseHit(bus, rate, at, gain * 0.25, 0.08, random, 0);
}

/** A one-pole low-pass filter in place; `cutoff` in Hz. */
export function lowpass(bus: Float32Array, rate: number, cutoff: number): void {
  const a = 1 - Math.exp((-TAU * cutoff) / rate);
  let y = 0;
  for (let i = 0; i < bus.length; i++) {
    y += a * (bus[i]! - y);
    bus[i] = y;
  }
}

/** A small Schroeder reverb: returns the wet signal only. */
export function reverb(dry: Float32Array, rate: number, size = 1): Float32Array {
  const wet = new Float32Array(dry.length);
  const combs = [29.7, 37.1, 41.1, 43.7].map((ms) => Math.round((ms * size * rate) / 1000));
  for (const [k, d] of combs.entries()) {
    const fb = 0.8 + k * 0.012;
    const line = new Float32Array(d);
    let at = 0;
    for (let i = 0; i < dry.length; i++) {
      const out = line[at]!;
      line[at] = dry[i]! + out * fb;
      wet[i]! += out / combs.length;
      at = (at + 1) % d;
    }
  }
  for (const ms of [5, 1.7]) {
    const d = Math.round((ms * rate) / 1000);
    const line = new Float32Array(d);
    let at = 0;
    for (let i = 0; i < wet.length; i++) {
      const buffered = line[at]!;
      const input = wet[i]!;
      const out = -0.7 * input + buffered;
      line[at] = input + 0.7 * out;
      wet[i] = out;
      at = (at + 1) % d;
    }
  }
  return wet;
}

/** Scales the bus so its loudest sample is `peak`. */
export function normalise(bus: Float32Array, peak = 0.89): Float32Array {
  let max = 0;
  for (const s of bus) max = Math.max(max, Math.abs(s));
  if (max > 0) for (let i = 0; i < bus.length; i++) bus[i] = (bus[i]! * peak) / max;
  return bus;
}
