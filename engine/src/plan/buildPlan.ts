import { readStyle } from "../catalog/styles.js";
import type { Page } from "../page/types.js";
import type { Beat, Script } from "../script/parseScript.js";
import type { WordTiming } from "../timing/align.js";
import type { Scene, SceneKind, VideoPlan } from "./types.js";

const FPS = 30;
const TAIL_FRAMES = 15;

export interface BuildPlanInput {
  script: Script;
  words: WordTiming[];
  audioDurationSec: number;
  page: Page;
  style: number;
  captions: number;
  warn: (m: string) => void;
  /** The voice-over relative to the video folder; defaults to voice.wav. */
  audioSrc?: string;
}

/**
 * Turns a script and the word timings of its voice-over into frame-accurate scenes:
 * one per beat, starting at the beat's first spoken word, back to back to the end.
 */
export function buildPlan({ script, words, audioDurationSec, page, style, captions, warn, audioSrc = "voice.wav" }: BuildPlanInput): VideoPlan {
  const durationInFrames = Math.ceil(audioDurationSec * FPS) + TAIL_FRAMES;
  if (page.duration && (audioDurationSec < page.duration.minSec || audioDurationSec > page.duration.maxSec)) {
    const { minSec, maxSec } = page.duration;
    const target = minSec === maxSec ? `${minSec}s` : `${minSec}–${maxSec}s`;
    warn(`The voice-over is ${Math.round(audioDurationSec)}s but the page asks for ${target}; shorten or lengthen the script.`);
  }

  const wordsByBeat = assignWords(script.beats, words);
  const scenes: Scene[] = [];
  script.beats.forEach((beat, i) => {
    const beatWords = wordsByBeat[i]!;
    const previous = scenes.at(-1);
    if (beatWords.length === 0) {
      warn(`No spoken words were found for beat "${beat.id}"; it gets no scene of its own.`);
      return;
    }
    const fromFrame = previous ? Math.floor((beatWords[0]!.startMs / 1000) * FPS) : 0;
    if (previous && fromFrame <= previous.fromFrame) {
      warn(`Beat "${beat.id}" is spoken too quickly after the one before; it shares that scene.`);
      previous.words.push(...beatWords);
      return;
    }
    scenes.push({ beatId: beat.id, kind: kindOf(beat), text: beat.text, fromFrame, durationInFrames: 0, words: beatWords });
  });
  scenes.forEach((scene, i) => {
    scene.durationInFrames = (scenes[i + 1]?.fromFrame ?? durationInFrames) - scene.fromFrame;
  });

  return {
    fps: FPS,
    width: 1080,
    height: 1920,
    durationInFrames,
    style,
    captions,
    palette: page.palette ?? readStyle(style).defaultPalette,
    audioSrc,
    scenes,
  };
}

function kindOf(beat: Beat): SceneKind {
  if (beat.kind === "hook") return "title";
  if (beat.kind === "ending") return "outro";
  return beat.text.split("\n").filter((l) => /^\s*-\s+/.test(l)).length >= 3 ? "list" : "fact";
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Matches the words whisper heard to the script's words with a minimum edit
 * alignment, so a word heard differently ("3" for "three") or an extra word
 * ("um") does not shift the beats. Returns the heard words of each beat.
 */
function assignWords(beats: Beat[], heard: WordTiming[]): WordTiming[][] {
  const written: { word: string; beat: number }[] = [];
  beats.forEach((beat, b) => {
    for (const w of beat.text.replace(/^\s*-\s+/gm, "").split(/\s+/)) {
      const n = norm(w);
      if (n) written.push({ word: n, beat: b });
    }
  });
  const spoken = heard.map((w) => norm(w.text));

  // cost[i][j]: edit distance between the first i written and first j heard words.
  const rows = written.length + 1;
  const cols = spoken.length + 1;
  const cost = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const same = written[i - 1]!.word === spoken[j - 1] ? 0 : 1;
      cost[i]![j] = Math.min(cost[i - 1]![j - 1]! + same, cost[i - 1]![j]! + 1, cost[i]![j - 1]! + 1);
    }
  }

  // Walk back: each heard word takes the beat of the written word it lines up with;
  // an extra heard word takes the beat of the written word before it.
  const beatOfHeard = new Array<number | undefined>(spoken.length);
  let i = rows - 1;
  let j = cols - 1;
  while (j > 0) {
    if (i > 0 && cost[i]![j] === cost[i - 1]![j - 1]! + (written[i - 1]!.word === spoken[j - 1] ? 0 : 1)) {
      beatOfHeard[--j] = written[--i]!.beat;
    } else if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) {
      i--;
    } else {
      beatOfHeard[--j] = i > 0 ? written[i - 1]!.beat : 0;
    }
  }

  const byBeat = beats.map((): WordTiming[] => []);
  heard.forEach((w, k) => byBeat[beatOfHeard[k] ?? 0]!.push(w));
  return byBeat;
}
