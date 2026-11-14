import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Catalog } from "../catalog/catalog.js";
import { loadPage } from "../page/loadPage.js";
import { loadMascot } from "../page/mascot.js";
import { resolveChoice } from "../page/resolveChoice.js";
import type { ChoiceField, Page } from "../page/types.js";
import { CATALOG_DIR } from "../paths.js";
import { buildPlan } from "../plan/buildPlan.js";
import type { VideoPlan } from "../plan/types.js";
import type { CheckReport } from "../check/types.js";
import { renderVideo, type RenderOptions } from "../render/renderVideo.js";
import { parseScript } from "../script/parseScript.js";
import { alignWords, type WordTiming } from "../timing/align.js";
import { readWavFile, speechPauses } from "../audio/speech.js";
import { readingTimings } from "../timing/reading.js";
import { evenOutCrushedWords, snapToPauses } from "../timing/snap.js";
import { SEAMLESS_LOOP } from "../../remotion/core/endings.js";
import { type SoundtrackRequest, writeSoundtrack } from "../music/soundtrack.js";
import { prepareVoice } from "../voice/prepare.js";
import { getVoiceProvider } from "../voice/registry.js";
import { checkVideo, summaryLines } from "./check.js";
import type { VoiceProvider } from "../voice/types.js";

export interface MakeDeps {
  catalog: Catalog;
  voiceProvider(requested: string, env: NodeJS.ProcessEnv, warn: (msg: string) => void): VoiceProvider;
  /** Adds the lead-in and brings the voice-over to the target loudness, in place. */
  prepareVoice(wavPath: string): Promise<void>;
  align(wavPath: string, language: string): Promise<WordTiming[]>;
  /** Writes the soundtrack (the music mood under the voice-over, if any) into the video folder; returns its file name. */
  mixMusic(videoDir: string, request: SoundtrackRequest): Promise<string>;
  render(plan: VideoPlan, outPath: string, options: RenderOptions): Promise<void>;
  check(videoDir: string): Promise<CheckReport>;
  env: NodeJS.ProcessEnv;
  log(msg: string): void;
}

export const defaultMakeDeps = (): MakeDeps => ({
  catalog: Catalog.load(CATALOG_DIR),
  voiceProvider: getVoiceProvider,
  prepareVoice,
  // Whisper's times, with each word after a pause moved to where the voice really starts it
  // (pauses down to 100 ms, so every pause the 150 ms sync check finds is covered), and
  // words whisper squeezed to almost nothing given back a moment.
  align: async (wavPath, language) =>
    evenOutCrushedWords(snapToPauses(await alignWords(wavPath, language), speechPauses(readWavFile(wavPath), SNAP_MIN_PAUSE_MS))),
  mixMusic: writeSoundtrack,
  render: renderVideo,
  check: (videoDir) => checkVideo(videoDir),
  env: process.env,
  log: (msg) => console.error(msg),
});

const SNAP_MIN_PAUSE_MS = 100;

/** Voice 08 in the voice catalog: no voice-over, the captions carry the video. */
export const TEXT_ONLY_VOICE = 8;
/** Music 08 in the music catalog: no music. */
export const NO_MUSIC = 8;

/** Bumped when the voice-over is processed differently, so cached voice-overs are made again. */
const VOICE_PROCESSING = "lead-in 250, loudnorm -14, pause snap 100, crushed words";

/** timing.json: the voice-over's word timings, keyed by what produced the voice. */
interface TimingFile {
  hash: string;
  provider: string;
  durationSec: number;
  words: WordTiming[];
}

/**
 * Makes one video from `<videoDir>/script.md` and the page profile two folders up
 * (`<page>/videos/<video>/`). Writes voice.wav, timing.json, plan.json and video.mp4
 * into the video folder, then runs the automatic checks (check.json); the voice and
 * timings are reused while the spoken text, voice and language stay the same.
 */
export async function makeVideo(videoDir: string, deps: MakeDeps = defaultMakeDeps()): Promise<{ plan: VideoPlan; report: CheckReport }> {
  const dir = resolve(videoDir);
  const scriptFile = join(dir, "script.md");
  if (!existsSync(scriptFile)) throw new Error(`script.md not found in ${dir}`);
  const pageDir = resolve(dir, "..", "..");
  const page = await loadPage(pageDir, deps.catalog);
  const mascot = loadMascot(pageDir);
  const script = parseScript(readFileSync(scriptFile, "utf8"));

  const style = choose("style", page, deps, script.choices.style);
  const captions = choose("captions", page, deps, script.choices.captions);
  const voiceType = choose("voice", page, deps, script.choices.voice);
  const music = choose("music", page, deps, script.choices.music);
  const textOnly = voiceType === TEXT_ONLY_VOICE;
  const timing = textOnly ? readingTiming(script.spokenText) : await recordVoice(dir, script.spokenText, voiceType, page, deps);
  writeFileSync(join(dir, "timing.json"), `${JSON.stringify(timing, null, 2)}\n`);

  const plan = buildPlan({ script, words: timing.words, audioDurationSec: timing.durationSec, page, style, captions, voice: voiceType, warn: deps.log, audioSrc: textOnly ? null : "voice.wav", mascot });
  if (music !== NO_MUSIC) {
    deps.log(`Mixing music ${music} (${deps.catalog.get("music", music).name}) under the ${textOnly ? "captions" : "voice-over"}`);
    plan.audioSrc = await deps.mixMusic(dir, {
      mood: music,
      durationSec: plan.durationInFrames / plan.fps,
      ...(textOnly ? {} : { voiceWav: join(dir, "voice.wav") }),
      loop: plan.ending === SEAMLESS_LOOP,
    });
    plan.music = music;
  }
  writeFileSync(join(dir, "plan.json"), `${JSON.stringify(plan, null, 2)}\n`);

  const out = join(dir, "video.mp4");
  deps.log(`Rendering ${plan.durationInFrames} frames`);
  const scenes = join(dir, "scenes", "index.tsx");
  await deps.render(plan, out, { assetsDir: dir, ...(existsSync(scenes) ? { scenes } : {}) });
  deps.log(`Done: ${out}`);
  const report = await deps.check(dir);
  for (const line of summaryLines(report)) deps.log(line);
  return { plan, report };
}

/** Timings for a text-only video: no voice, the captions at reading pace. */
function readingTiming(text: string): TimingFile {
  const { words, durationSec } = readingTimings(text);
  return { hash: "text only", provider: "none", durationSec, words };
}

/**
 * Records, prepares and times the voice-over into voice.wav, or reuses it while the
 * spoken text, the concrete voice and the language stay the same.
 */
async function recordVoice(dir: string, text: string, voiceType: number, page: Page, deps: MakeDeps): Promise<TimingFile> {
  const voice = deps.voiceProvider(page.providers.voice, deps.env, deps.log);
  const concrete = voice.describeVoice?.(page.language, voiceType);
  if (concrete?.note) deps.log(concrete.note);
  const wavPath = join(dir, "voice.wav");
  const hash = createHash("sha256").update(JSON.stringify([text, voice.id, voiceType, concrete?.id ?? "", page.language, VOICE_PROCESSING])).digest("hex");
  const cached = readTiming(join(dir, "timing.json"));
  if (cached?.hash === hash && existsSync(wavPath)) {
    deps.log("Voice-over unchanged; reusing voice.wav and timing.json");
    return cached;
  }
  deps.log(`Recording the voice-over (${voice.id}, voice ${voiceType}, ${page.language})`);
  const result = await voice.synthesize(text, { language: page.language, voiceType, outPath: wavPath });
  await deps.prepareVoice(wavPath);
  deps.log("Timing every word");
  const words = await deps.align(wavPath, page.language);
  if (words.length === 0) {
    throw new Error(`Whisper heard no words in ${wavPath}. Listen to it: if it is silent or noise, run "unfaced doctor" to check the voice; if it sounds right, run make again.`);
  }
  return { hash, provider: result.provider, durationSec: result.durationSec, words };
}

/**
 * The catalog entry for one of this video's choices, which must be ready. The script's own
 * choice (front matter) wins; otherwise the page's fixed number is used as is, and a list or
 * "auto" is narrowed to the first ready option (the video-make skill writes its pick into the
 * script, so this fallback is only for scripts made by hand).
 */
export function choose(field: ChoiceField, page: Page, deps: Pick<MakeDeps, "catalog" | "log">, forVideo?: number): number {
  const choice = page.choices[field];
  if (forVideo !== undefined) {
    const { name } = deps.catalog.get(field, forVideo);
    if (choice !== forVideo) deps.log(`${field} ${forVideo} (${name}) for this video, from script.md; the page says ${JSON.stringify(choice ?? "auto")}`);
  }
  const chosen = forVideo ?? resolveChoice(field, choice, deps.catalog, (options) => {
    const ready = options.find((n) => deps.catalog.get(field, n).status === "ready");
    if (ready === undefined) throw new Error(`None of the ${field} options ${options.join(", ")} is ready yet; see "unfaced list ${field}"`);
    deps.log(`${field}: ${JSON.stringify(choice ?? "auto")} → ${ready} (${deps.catalog.get(field, ready).name})`);
    return ready;
  });
  // A fixed number is used as is, so it is checked here, before any voice is recorded.
  const entry = deps.catalog.get(field, chosen);
  if (entry.status !== "ready") throw new Error(`${field} ${chosen} (${entry.name}) is not ready yet; pick a ready one from "unfaced list ${field}"`);
  return chosen;
}

function readTiming(file: string): TimingFile | undefined {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as TimingFile;
  } catch {
    return undefined;
  }
}
