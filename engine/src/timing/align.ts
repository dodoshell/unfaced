import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { downloadWhisperModel, installWhisperCpp, transcribe, type TranscriptionJson, type WhisperModel } from "@remotion/install-whisper-cpp";
import sherpa from "sherpa-onnx-node";
import { unfacedHome } from "../paths.js";

export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
}

// 1.5.5 is the release Remotion builds for Windows and the first with DTW token timestamps.
const WHISPER_CPP_VERSION = "1.5.5";
const WHISPER_RATE = 16000;

type Segment = TranscriptionJson<true>["transcription"][number];
type Token = Segment["tokens"][number];

/** Word-level timestamps for a spoken WAV, from a local whisper.cpp (installed on first use). */
export async function alignWords(wavPath: string, language: string): Promise<WordTiming[]> {
  const base = language.toLowerCase().split("-")[0]!;
  const model: WhisperModel = base === "en" ? "base.en" : "base";
  const home = join(unfacedHome(), "whisper");
  const whisperPath = join(home, `whisper.cpp-${WHISPER_CPP_VERSION}`);
  const modelFolder = join(home, "models");
  mkdirSync(modelFolder, { recursive: true });
  await installWhisperCpp({ to: whisperPath, version: WHISPER_CPP_VERSION, printOutput: false });
  await downloadWhisperModel({ model, folder: modelFolder, printOutput: false });

  const work = mkdtempSync(join(tmpdir(), "unfaced-align-"));
  try {
    const wave = sherpa.readWave(wavPath);
    const durationMs = (wave.samples.length / wave.sampleRate) * 1000;
    const input = join(work, "input.wav");
    sherpa.writeWave(input, { samples: to16k(wave), sampleRate: WHISPER_RATE });
    const output = await transcribe({
      inputPath: input,
      whisperPath,
      whisperCppVersion: WHISPER_CPP_VERSION,
      model,
      modelFolder,
      tokenLevelTimestamps: true,
      language: base as never,
      printOutput: false,
    });
    return wordsFrom(output.transcription, durationMs);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function to16k(wave: { samples: Float32Array; sampleRate: number }): Float32Array {
  if (wave.sampleRate === WHISPER_RATE) return wave.samples;
  return new sherpa.LinearResampler(wave.sampleRate, WHISPER_RATE).flush(wave.samples);
}

/**
 * Groups whisper tokens into words, across segments: a token starting with a
 * space starts a new word; punctuation and word pieces join the word before.
 */
export function wordsFrom(segments: Segment[], durationMs: number): WordTiming[] {
  const words: Token[][] = [];
  for (const token of segments.flatMap((s) => s.tokens)) {
    if (/^\[_.*\]$/.test(token.text) || token.text.trim() === "") continue; // [_BEG_], [_TT_123] and blanks
    if (token.text.startsWith(" ") || words.length === 0) words.push([token]);
    else words.at(-1)!.push(token);
  }

  // DTW times are sharper than the segment offsets but sometimes stick to an
  // earlier value (often with multilingual models); use them only when they
  // fall inside the token's own window. Starts must strictly increase.
  const starts: number[] = [];
  for (const [first] of words as [Token, ...Token[]][]) {
    const dtw = first.t_dtw * 10;
    const candidate = first.t_dtw >= 0 && dtw >= first.offsets.from && dtw <= first.offsets.to ? dtw : first.offsets.from;
    const previous = starts.at(-1);
    starts.push(Math.min(previous === undefined ? candidate : Math.max(candidate, previous + 1), durationMs));
  }
  return words.map((tokens, i) => {
    const startMs = starts[i]!;
    const endMs = Math.min(starts[i + 1] ?? tokens.at(-1)!.offsets.to, durationMs);
    return { text: tokens.map((t) => t.text).join("").trim(), startMs, endMs: Math.max(endMs, startMs) };
  });
}
