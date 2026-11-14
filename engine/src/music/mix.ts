import type { Pcm } from "../audio/speech.js";

const HOP_MS = 10;
/** Music level, as its loud parts relative to the voice's loud parts: under speech, and between sentences. */
const DUCKED_DB = -34;
const BED_DB = -26;
/** Speech keeps the music down this long either side, so short pauses don't pump it up. */
const HOLD_MS = 450;
const ATTACK_HOPS = 5;
const RELEASE_HOPS = 30;
const FADE_IN_SEC = 0.8;
const FADE_OUT_SEC = 0.9;
/** A loop keeps the music going to the cut; this short fade only stops a click. */
const LOOP_FADE_SEC = 0.02;

export interface MixOptions {
  /** The video loops (ending 01): no audible fade at the edges, so the replay runs on. */
  loop?: boolean;
}

function levels(samples: Float32Array, hop: number): number[] {
  const out: number[] = [];
  for (let start = 0; start < samples.length; start += hop) {
    let sum = 0;
    const end = Math.min(samples.length, start + hop);
    for (let i = start; i < end; i++) sum += samples[i]! ** 2;
    out.push(Math.sqrt(sum / Math.max(1, end - start)));
  }
  return out;
}

const p99 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.99)] ?? 0;

/**
 * The soundtrack: the voice-over with the music under it, as long as the music. The
 * music ducks under speech and comes up a little between sentences, always staying
 * well below the voice (so the checks still find where speech starts), and fades in
 * and out (only for a few milliseconds in a loop). Without a voice the music is
 * returned faded, at its own level.
 */
export function mixSoundtrack(music: Float32Array, rate: number, voice?: Pcm, { loop = false }: MixOptions = {}): Float32Array {
  if (voice && voice.rate !== rate) throw new Error(`The music (${rate} Hz) and the voice-over (${voice.rate} Hz) must have the same sample rate`);
  const hop = Math.round((rate * HOP_MS) / 1000);
  const hops = Math.ceil(music.length / hop);
  const gains = new Float32Array(hops).fill(1);

  if (voice) {
    const voiceLevels = levels(voice.samples, hop);
    const ref = p99(voiceLevels);
    const musicRef = p99(levels(music, hop)) || 1;
    const speaking = voiceLevels.map((l) => l > ref * 0.1);
    const hold = Math.round(HOLD_MS / HOP_MS);
    const near = (h: number) => {
      for (let k = Math.max(0, h - hold); k <= Math.min(speaking.length - 1, h + hold); k++) if (speaking[k]) return true;
      return false;
    };
    let g = 0;
    for (let h = 0; h < hops; h++) {
      const target = (ref * 10 ** ((near(h) ? DUCKED_DB : BED_DB) / 20)) / musicRef;
      g += (target - g) / (target < g ? ATTACK_HOPS : RELEASE_HOPS);
      gains[h] = h === 0 ? target : g;
      if (h === 0) g = target;
    }
  }

  const out = new Float32Array(music.length);
  const total = music.length / rate;
  const [fadeIn, fadeOut] = loop ? [LOOP_FADE_SEC, LOOP_FADE_SEC] : [FADE_IN_SEC, FADE_OUT_SEC];
  for (let i = 0; i < music.length; i++) {
    const t = i / rate;
    const fade = Math.min(1, (t / fadeIn) ** 3, ((total - t) / fadeOut) ** 3);
    const v = voice && i < voice.samples.length ? voice.samples[i]! : 0;
    out[i] = Math.max(-1, Math.min(1, v + music[i]! * gains[Math.floor(i / hop)]! * fade));
  }
  return out;
}
