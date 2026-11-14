import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";

/** Mono audio as samples from −1 to 1. */
export interface Pcm {
  samples: Float32Array;
  rate: number;
}

/** Audio is measured in steps of this many milliseconds. */
const HOP_MS = 10;
/** Speech is louder than this share of the loud parts (−20 dB), and never quieter than −60 dBFS. */
const SPEECH_SHARE = 0.1;
const FLOOR = 0.001;
/** A pause at least this long before speech makes the speech an onset (a new phrase). */
export const MIN_PAUSE_MS = 150;
/** A sound shorter than this on its own is a click or a lip smack, not speech. */
const MIN_SPEECH_MS = 30;

/** Reads a 16-bit PCM WAV, mixed down to mono. A data size ffmpeg could not fill in (piped output) means "to the end". */
export function parseWav(wav: Buffer): Pcm {
  let channels = 0;
  let rate = 0;
  let bits = 0;
  for (let at = 12; at + 8 <= wav.length; ) {
    const id = wav.toString("ascii", at, at + 4);
    const size = wav.readUInt32LE(at + 4);
    if (id === "fmt ") {
      channels = wav.readUInt16LE(at + 10);
      rate = wav.readUInt32LE(at + 12);
      bits = wav.readUInt16LE(at + 22);
    } else if (id === "data") {
      if (bits !== 16 || channels < 1) throw new Error(`Only 16-bit PCM WAV is supported (got ${bits}-bit, ${channels} channels)`);
      const end = Math.min(at + 8 + size, wav.length);
      const frames = Math.floor((end - at - 8) / (2 * channels));
      const samples = new Float32Array(frames);
      for (let f = 0; f < frames; f++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) sum += wav.readInt16LE(at + 8 + 2 * (f * channels + c));
        samples[f] = sum / channels / 32768;
      }
      return { samples, rate };
    }
    at += 8 + size + (size % 2);
  }
  throw new Error("Not a WAV file with fmt and data chunks");
}

export const readWavFile = (file: string): Pcm => parseWav(readFileSync(file));

/** A 16-bit PCM mono WAV file of the samples. */
export function encodeWav({ samples, rate }: Pcm): Buffer {
  const data = samples.length * 2;
  const wav = Buffer.alloc(44 + data);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + data, 4);
  wav.write("WAVEfmt ", 8, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(data, 40);
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767), 44 + 2 * i);
  return wav;
}

/**
 * Decodes a video's soundtrack as mono at its own sample rate. Resampling lower would drop
 * the hiss of an "s" or "f" (above 8 kHz at 16 kHz), and the checks would hear a pause there.
 */
export async function readSoundtrack(video: string): Promise<Pcm> {
  const { stdout } = await runFfmpeg(["-v", "error", "-i", resolve(video), "-vn", "-ac", "1", "-c:a", "pcm_s16le", "-f", "wav", "-"]);
  return parseWav(stdout);
}

/** RMS level of each 10 ms step. */
function levels({ samples, rate }: Pcm): number[] {
  const hop = Math.round((rate * HOP_MS) / 1000);
  const out: number[] = [];
  for (let start = 0; start + hop <= samples.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + hop; i++) sum += samples[i]! * samples[i]!;
    out.push(Math.sqrt(sum / hop));
  }
  return out;
}

function speechSteps(pcm: Pcm): boolean[] {
  const level = levels(pcm);
  const sorted = [...level].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
  const threshold = Math.max(loud * SPEECH_SHARE, FLOOR);
  const steps = level.map((l) => l > threshold);
  const shortest = MIN_SPEECH_MS / HOP_MS;
  for (let i = 0; i < steps.length; ) {
    let end = i;
    while (end < steps.length && steps[end] === steps[i]) end++;
    if (steps[i] && end - i < shortest) steps.fill(false, i, end);
    i = end;
  }
  return steps;
}

/** Quiet before speech: from the end of the speech before it (or the start of the audio) to where speech starts again. */
export interface Pause {
  fromMs: number;
  toMs: number;
}

/** Every pause of at least `minPauseMs` before speech, and the quiet at the very start. */
export function speechPauses(pcm: Pcm, minPauseMs = MIN_PAUSE_MS): Pause[] {
  const pauses: Pause[] = [];
  let quiet = minPauseMs;
  let lastSpeechEnd = 0;
  speechSteps(pcm).forEach((speech, i) => {
    if (!speech) {
      quiet += HOP_MS;
      return;
    }
    if (quiet >= minPauseMs) pauses.push({ fromMs: lastSpeechEnd, toMs: i * HOP_MS });
    quiet = 0;
    lastSpeechEnd = (i + 1) * HOP_MS;
  });
  return pauses;
}

/** Where speech starts after a pause of at least 150 ms (or at the very start), in ms. */
export const speechOnsets = (pcm: Pcm): number[] => speechPauses(pcm).map((p) => p.toMs);

/** Whether there is speech anywhere between two times, in ms. */
export function speechAt(pcm: Pcm, fromMs: number, toMs: number): boolean {
  return speechSteps(pcm).some((speech, i) => speech && (i + 1) * HOP_MS > fromMs && i * HOP_MS < toMs);
}

export const durationMs = ({ samples, rate }: Pcm): number => (samples.length / rate) * 1000;
