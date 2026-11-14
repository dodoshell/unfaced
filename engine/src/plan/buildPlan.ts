import { readStyle } from "../catalog/styles.js";
import type { Page } from "../page/types.js";
import type { Beat, Script } from "../script/parseScript.js";
import type { WordTiming } from "../timing/align.js";
import type { Mascot, Scene, SceneKind, VideoPlan } from "./types.js";

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
  /** The soundtrack relative to the video folder; defaults to voice.wav, null for a silent video. */
  audioSrc?: string | null;
  /** The voice type, so checks know a text-only video has no voice to follow. */
  voice?: number;
  mascot?: Mascot;
}

/**
 * Turns a script and the word timings of its voice-over into frame-accurate scenes:
 * one per beat, starting at the beat's first spoken word, back to back to the end.
 */
export function buildPlan({ script, words, audioDurationSec, page, style, captions, voice, warn, audioSrc = "voice.wav", mascot }: BuildPlanInput): VideoPlan {
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
    ...(audioSrc ? { audioSrc } : {}),
    ...(voice !== undefined ? { voice } : {}),
    ending: script.ending,
    ...(mascot ? { mascot } : {}),
    scenes,
  };
}

function kindOf(beat: Beat): SceneKind {
  if (beat.kind === "hook") return "title";
  if (beat.kind === "ending") return "outro";
  return beat.text.split("\n").filter((l) => /^\s*-\s+/.test(l)).length >= 3 ? "list" : "fact";
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

interface Written {
  norm: string;
  /** As written in the script: case, punctuation, accents, and any emoji next to it. */
  display: string;
  beat: number;
}

/** The script's words in order. A token with no letters or digits (an emoji, a dash) is shown with a word of its beat. */
function writtenWords(beats: Beat[]): Written[] {
  const words: Written[] = [];
  beats.forEach((beat, b) => {
    let lead: string[] = [];
    for (const token of beat.text.replace(/^\s*-\s+/gm, "").split(/\s+/)) {
      if (!token) continue;
      const last = words.at(-1);
      if (norm(token)) {
        words.push({ norm: norm(token), display: [...lead, token].join(" "), beat: b });
        lead = [];
      } else if (last?.beat === b) {
        last.display += ` ${token}`;
      } else {
        lead.push(token);
      }
    }
  });
  return words;
}

/**
 * Lines up the words whisper heard with the script's words (a minimum edit
 * alignment), so a word heard differently ("3" for "three") or an extra word ("um")
 * does not shift the beats. Returns each beat's words as written in the script,
 * with the times they were heard: an extra heard word is folded into its neighbour,
 * and a written word whisper missed is shown with the word before it.
 */
function assignWords(beats: Beat[], heard: WordTiming[]): WordTiming[][] {
  const written = writtenWords(beats);
  const spoken = heard.map((w) => norm(w.text));

  // cost[i][j]: edit distance between the first i written and first j heard words.
  const rows = written.length + 1;
  const cols = spoken.length + 1;
  const cost = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  const sub = (i: number, j: number) => (written[i]!.norm === spoken[j] ? 0 : 1);
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      cost[i]![j] = Math.min(cost[i - 1]![j - 1]! + sub(i - 1, j - 1), cost[i - 1]![j]! + 1, cost[i]![j - 1]! + 1);
    }
  }

  // Walk back to the start: a pair (written and heard), a written word only, or a heard word only.
  const steps: Array<{ w?: number; h?: number }> = [];
  for (let i = rows - 1, j = cols - 1; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && cost[i]![j] === cost[i - 1]![j - 1]! + sub(i - 1, j - 1)) steps.push({ w: --i, h: --j });
    else if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) steps.push({ w: --i });
    else steps.push({ h: --j });
  }

  const words: Array<WordTiming & { beat: number }> = [];
  let heardBefore: WordTiming | undefined;
  let missedBefore: Written[] = [];
  for (const { w, h } of steps.reverse()) {
    const last = words.at(-1);
    if (w !== undefined && h !== undefined) {
      const word = written[w]!;
      const lead = missedBefore.filter((m) => m.beat === word.beat).map((m) => m.display);
      words.push({ text: [...lead, word.display].join(" "), startMs: (heardBefore ?? heard[h]!).startMs, endMs: heard[h]!.endMs, beat: word.beat });
      heardBefore = undefined;
      missedBefore = [];
    } else if (w !== undefined) {
      if (last?.beat === written[w]!.beat) last.text += ` ${written[w]!.display}`;
      else missedBefore.push(written[w]!);
    } else if (last) {
      last.endMs = Math.max(last.endMs, heard[h!]!.endMs);
    } else {
      heardBefore ??= heard[h!];
    }
  }

  const byBeat = beats.map((): WordTiming[] => []);
  for (const { beat, ...word } of words) byBeat[beat]!.push(word);
  return byBeat;
}
