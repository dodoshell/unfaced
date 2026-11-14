// The music moods of the catalog (catalog/music.md), written as code: each mood is a tempo,
// a chord progression and a few instruments, so a track of any length can be made.
import { boom, hz, kick, lowpass, noiseHit, normalise, note, reverb, rng } from "./synth.js";

/** Moods with music; 08 is "none". */
export const MOODS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Mood = (typeof MOODS)[number];

type Chord = number[];
const M = (root: number): Chord => [root, root + 4, root + 7];
const m = (root: number): Chord => [root, root + 3, root + 7];
const M7 = (root: number): Chord => [root, root + 4, root + 7, root + 11];
const m7 = (root: number): Chord => [root, root + 3, root + 7, root + 10];

interface Song {
  bus: Float32Array;
  rate: number;
  dur: number;
  /** Seconds per beat. */
  beat: number;
  random: () => number;
  /** Calls `fn` for every bar that starts before the end, with the bar's chord. */
  bars(beatsPerBar: number, progression: Chord[], fn: (at: number, chord: Chord, bar: number) => void, barsPerChord?: number): void;
}

function song(rate: number, dur: number, bpm: number, seed: number): Song {
  const beat = 60 / bpm;
  return {
    bus: new Float32Array(Math.round(dur * rate)),
    rate,
    dur,
    beat,
    random: rng(seed),
    bars(beatsPerBar, progression, fn, barsPerChord = 1) {
      for (let bar = 0; bar * beatsPerBar * beat < dur; bar++) fn(bar * beatsPerBar * beat, progression[Math.floor(bar / barsPerChord) % progression.length]!, bar);
    },
  };
}

function withReverb(s: Song, amount: number, size = 1): Float32Array {
  const wet = reverb(s.bus, s.rate, size);
  for (let i = 0; i < s.bus.length; i++) s.bus[i]! += amount * wet[i]!;
  return s.bus;
}

/** 01 Suspense: a low drone, a slow heartbeat and a high tremolo note that creeps in. */
function suspense(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 70, 101);
  const { bus, beat } = s;
  note(bus, rate, { at: 0, dur, freq: hz(38), gain: 0.16, wave: "saw", attack: 2, release: 1 });
  note(bus, rate, { at: 0, dur, freq: hz(45), gain: 0.1, wave: "triangle", attack: 3, release: 1 });
  lowpass(bus, rate, 500);
  s.bars(4, [m(62), M(58), m(55), M(57)], (at, chord) => {
    for (const n of chord) note(bus, rate, { at, dur: 8 * beat, freq: hz(n - 12), gain: 0.05, wave: "triangle", attack: 1.5, release: 1.5 });
  }, 2);
  s.bars(4, [[0]], (at) => {
    const rise = 0.3 + 0.3 * (at / dur);
    kick(bus, rate, at, rise);
    kick(bus, rate, at + beat * 0.3, rise * 0.7);
  });
  if (dur > 4) note(bus, rate, { at: dur * 0.4, dur: dur * 0.6, freq: hz(74), gain: 0.05, wave: "sine", attack: dur * 0.3, release: 0.5, tremolo: 0.8 });
  return normalise(withReverb(s, 0.35, 1.3));
}

/** 02 Epic: big drums, string chords and brass stabs in a minor key. */
function epic(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 90, 202);
  const { bus, beat, random } = s;
  s.bars(4, [m(60), M(56), M(63), M(58)], (at, chord, bar) => {
    for (const n of chord) {
      note(bus, rate, { at, dur: 4 * beat, freq: hz(n - 12), gain: 0.06, wave: "saw", attack: 0.3, release: 0.4, vibrato: 0.1 });
      note(bus, rate, { at, dur: 0.6, freq: hz(n), gain: 0.05, wave: "saw", attack: 0.02, decay: 0.35 });
    }
    note(bus, rate, { at, dur: 2 * beat, freq: hz(chord[0]! - 24), gain: 0.2, wave: "saw", attack: 0.05 });
    note(bus, rate, { at: at + 2 * beat, dur: 2 * beat, freq: hz(chord[0]! - 24), gain: 0.2, wave: "saw", attack: 0.05 });
    boom(bus, rate, at, 0.8, random);
    boom(bus, rate, at + 2 * beat, 0.6, random);
    noiseHit(bus, rate, at + 3.5 * beat, 0.25, 0.09, random, 1, 160);
    if (bar % 4 === 3) for (let k = 0; k < 8; k++) noiseHit(bus, rate, at + 2 * beat + (k * beat) / 4, 0.12 + k * 0.03, 0.06, random, 1, 150);
  });
  lowpass(bus, rate, 4000);
  return normalise(withReverb(s, 0.25, 1.2));
}

/** 03 Lo-fi: dusty electric piano chords over a lazy, swung beat. */
function lofi(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 80, 303);
  const { bus, beat, random } = s;
  s.bars(4, [M7(65), m7(64), m7(62), M7(60)], (at, chord) => {
    for (const [k, n] of chord.entries()) {
      note(bus, rate, { at: at + k * 0.012, dur: 2.5 * beat, freq: hz(n), gain: 0.07, wave: "epiano", attack: 0.01, decay: 1.2, tremolo: 0.25 });
      note(bus, rate, { at: at + 1.5 * beat + k * 0.012, dur: 2 * beat, freq: hz(n), gain: 0.05, wave: "epiano", decay: 0.9, tremolo: 0.25 });
    }
    note(bus, rate, { at, dur: 1.8 * beat, freq: hz(chord[0]! - 24), gain: 0.22, wave: "triangle", attack: 0.02 });
    note(bus, rate, { at: at + 2 * beat, dur: 1.8 * beat, freq: hz(chord[0]! - 24), gain: 0.18, wave: "triangle", attack: 0.02 });
    kick(bus, rate, at, 0.45);
    kick(bus, rate, at + 2.5 * beat, 0.35);
    noiseHit(bus, rate, at + beat, 0.16, 0.06, random, 0, 190);
    noiseHit(bus, rate, at + 3 * beat, 0.16, 0.06, random, 0, 190);
    for (let k = 0; k < 8; k++) noiseHit(bus, rate, at + (k * beat) / 2 + (k % 2 ? 0.08 * beat : 0), 0.05, 0.018, random, 2);
  });
  for (let i = 0; i < bus.length; i++) if (random() < 0.0004) bus[i]! += (random() - 0.5) * 0.08;
  lowpass(bus, rate, 3200);
  return normalise(withReverb(s, 0.15));
}

/** 04 Upbeat: a bright plucked arpeggio, four-on-the-floor kick and claps. */
function upbeat(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 120, 404);
  const { bus, beat, random } = s;
  s.bars(4, [M(67), M(62), m(64), M(60)], (at, chord) => {
    const arp = [chord[0]!, chord[1]!, chord[2]!, chord[0]! + 12];
    for (let k = 0; k < 8; k++) {
      note(bus, rate, { at: at + (k * beat) / 2, dur: 0.4, freq: hz(arp[k % 4]!), gain: 0.09, wave: "triangle", decay: 0.18 });
      note(bus, rate, { at: at + (k * beat) / 2, dur: 0.3, freq: hz(chord[0]! - 24), gain: 0.16, wave: "saw", decay: 0.15 });
      if (k % 2) noiseHit(bus, rate, at + (k * beat) / 2, 0.07, 0.02, random, 2);
    }
    for (const n of chord) note(bus, rate, { at, dur: 4 * beat, freq: hz(n), gain: 0.03, wave: "triangle", attack: 0.1, release: 0.2 });
    for (let b = 0; b < 4; b++) kick(bus, rate, at + b * beat, 0.5);
    noiseHit(bus, rate, at + beat, 0.28, 0.05, random, 1, 0);
    noiseHit(bus, rate, at + 3 * beat, 0.28, 0.05, random, 1, 0);
  });
  return normalise(withReverb(s, 0.12));
}

/** 05 Playful: a bouncy marimba tune, pizzicato bass and a woodblock tick. */
function playful(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 110, 505);
  const { bus, beat, random } = s;
  const scale = [60, 62, 64, 67, 69, 72, 74, 76];
  let step = 2;
  s.bars(4, [M(60), M(65), M(67), M(60)], (at, chord) => {
    for (let k = 0; k < 8; k++) {
      step = Math.max(0, Math.min(scale.length - 1, step + Math.round(random() * 4 - 2)));
      if (random() < 0.8) note(bus, rate, { at: at + (k * beat) / 2, dur: 0.35, freq: hz(scale[step]!), gain: 0.13, wave: "marimba", decay: 0.2 });
    }
    for (let b = 0; b < 4; b++) {
      note(bus, rate, { at: at + b * beat, dur: 0.25, freq: hz((b % 2 ? chord[2]! : chord[0]!) - 24), gain: 0.22, wave: "triangle", decay: 0.12 });
      for (let q = 0; q < 4; q++) noiseHit(bus, rate, at + b * beat + (q * beat) / 4, q === 0 ? 0.04 : 0.025, 0.015, random, 2);
    }
    note(bus, rate, { at: at + beat, dur: 0.1, freq: 820, gain: 0.12, wave: "sine", decay: 0.03 });
    note(bus, rate, { at: at + 3 * beat, dur: 0.1, freq: 820, gain: 0.12, wave: "sine", decay: 0.03 });
  });
  return normalise(withReverb(s, 0.12));
}

/** 06 Emotional: soft piano arpeggios with strings that swell in. */
function emotional(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 66, 606);
  const { bus, beat } = s;
  s.bars(4, [m(57), M(53), M(60), M(55)], (at, chord, bar) => {
    const arp = [chord[0]!, chord[2]!, chord[0]! + 12, chord[1]! + 12];
    for (let k = 0; k < 8; k++) note(bus, rate, { at: at + (k * beat) / 2, dur: 2 * beat, freq: hz(arp[k % 4]!), gain: 0.08, wave: "epiano", decay: 1.5 });
    note(bus, rate, { at, dur: 4 * beat, freq: hz(chord[0]! - 24), gain: 0.14, wave: "sine", attack: 0.1, release: 0.5 });
    if (bar >= 2) for (const n of chord) note(bus, rate, { at, dur: 4 * beat + 0.4, freq: hz(n - 12), gain: 0.045, wave: "saw", attack: 1, release: 0.8, vibrato: 0.08 });
  });
  lowpass(bus, rate, 3500);
  return normalise(withReverb(s, 0.4, 1.4));
}

/** 07 Mystery: a tritone drone and sparse bells from a whole-tone scale. */
function mystery(rate: number, dur: number): Float32Array {
  const s = song(rate, dur, 60, 707);
  const { bus, beat, random } = s;
  note(bus, rate, { at: 0, dur, freq: hz(36), gain: 0.14, wave: "triangle", attack: 2, release: 1, tremolo: 0.3 });
  note(bus, rate, { at: 0, dur, freq: hz(42), gain: 0.08, wave: "sine", attack: 3, release: 1 });
  const wholeTone = [72, 74, 76, 78, 80, 82, 84];
  for (let at = 0.5; at < dur - 0.5; at += beat * (1 + Math.floor(random() * 3))) {
    note(bus, rate, { at, dur: 3, freq: hz(wholeTone[Math.floor(random() * wholeTone.length)]!), gain: 0.06, wave: "bell", decay: 2.5 });
  }
  s.bars(4, [[0]], (at, _c, bar) => {
    if (bar % 4 === 1) note(bus, rate, { at, dur: 2.2, freq: hz(66), gain: 0.05, wave: "saw", attack: 2, release: 0.15 });
  });
  lowpass(bus, rate, 5000);
  return normalise(withReverb(s, 0.5, 1.5));
}

const RENDER: Record<Mood, (rate: number, dur: number) => Float32Array> = { 1: suspense, 2: epic, 3: lofi, 4: upbeat, 5: playful, 6: emotional, 7: mystery };

/** A track of `durationSec` seconds in a mood at `rate` Hz, mono, peaking just under full scale. */
export function renderMusic(mood: number, durationSec: number, rate: number): Float32Array {
  const render = RENDER[mood as Mood];
  if (!render) throw new Error(`music ${mood} has no track; moods with music: ${MOODS.join(", ")} (08 is none)`);
  return render(rate, durationSec);
}

/** A loop is cut this far inside a longer render, clear of the song's own fade-in (2 s) and fade-out (1 s). */
const LOOP_MARGIN_SEC = 2.5;
/** The music past the loop's end fades into its start over this long. */
const LOOP_CROSSFADE_SEC = 1.5;

/**
 * Music for a video that loops: the replay runs on without a fade or a jump. A longer track
 * is rendered and cut away from its fades, and the music just past the cut is crossfaded into
 * the start, so the last sample leads into the first as it did in the longer track.
 */
export function renderLoopingMusic(mood: number, durationSec: number, rate: number): Float32Array {
  const n = Math.round(durationSec * rate);
  const margin = Math.round(LOOP_MARGIN_SEC * rate);
  const fade = Math.min(n, Math.round(LOOP_CROSSFADE_SEC * rate));
  const long = renderMusic(mood, (n + fade + 2 * margin) / rate, rate);
  const out = long.slice(margin, margin + n);
  for (let i = 0; i < fade; i++) {
    // Equal power, since the two stretches of music are unrelated.
    const k = ((i / fade) * Math.PI) / 2;
    out[i] = out[i]! * Math.sin(k) + long[margin + n + i]! * Math.cos(k);
  }
  return out;
}

