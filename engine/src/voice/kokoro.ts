import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import sherpa, { type OfflineTts } from "sherpa-onnx-node";
import { ensureModel, type ModelArchive } from "../download.js";
import type { VoiceProvider } from "./types.js";

// Kokoro-82M v1.0, int8, packaged for sherpa-onnx. See docs/decisions/0001-free-tts.md.
export const KOKORO_MODEL: ModelArchive = {
  name: "kokoro-int8-multi-lang-v1_0",
  url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-multi-lang-v1_0.tar.bz2",
  sha256: "72c347230107ef8a31098ec4d468a605244beef5f1ed00db97efa13518800653",
  sizeMb: 127,
  label: "free voice model",
};

// Speaker order inside voices.bin (from the model's speaker_names metadata).
const SPEAKERS = "af_alloy,af_aoede,af_bella,af_heart,af_jessica,af_kore,af_nicole,af_nova,af_river,af_sarah,af_sky,am_adam,am_echo,am_eric,am_fenrir,am_liam,am_michael,am_onyx,am_puck,am_santa,bf_alice,bf_emma,bf_isabella,bf_lily,bm_daniel,bm_fable,bm_george,bm_lewis,ef_dora,em_alex,ff_siwis,hf_alpha,hf_beta,hm_omega,hm_psi,if_sara,im_nicola,jf_alpha,jf_gongitsune,jf_nezumi,jf_tebukuro,jm_kumo,pf_dora,pm_alex,pm_santa,zf_xiaobei,zf_xiaoni,zf_xiaoxiao,zf_xiaoyi,zm_yunjian,zm_yunxi,zm_yunxia,zm_yunyang,em_santa".split(",");

export const KOKORO_SPEAKERS = SPEAKERS;

export interface KokoroVoice {
  speaker: string;
  speed: number;
  /** Set when the language has too few speakers for this voice type and a near one stands in. */
  note?: string;
}

interface LanguageSetup {
  name: string;
  /** espeak-ng language; English reads best without one, through the lexicon. */
  lang?: string;
  lexicon?: string;
  /** Voices by catalog voice number (1-7; 8 is "none"). */
  voices: Record<number, [speaker: string, speed: number]>;
  /** Voice types this language only approximates (same speaker as another type, different speed). */
  approx: number[];
}

// English has a speaker per voice type. Italian, Spanish, French, Portuguese and Hindi have
// one to four Kokoro speakers, so some voice types reuse a speaker at another speed.
const LANGUAGES: Record<string, LanguageSetup> = {
  en: {
    name: "English",
    lexicon: "lexicon-gb-en.txt",
    voices: { 1: ["bm_george", 0.95], 2: ["af_bella", 1.12], 3: ["bm_fable", 0.95], 4: ["af_nicole", 0.9], 5: ["am_onyx", 0.95], 6: ["af_heart", 1], 7: ["am_michael", 1.05] },
    approx: [],
  },
  it: {
    name: "Italian",
    lang: "it",
    voices: { 1: ["im_nicola", 0.95], 2: ["if_sara", 1.1], 3: ["im_nicola", 0.9], 4: ["if_sara", 0.88], 5: ["im_nicola", 0.92], 6: ["if_sara", 1], 7: ["im_nicola", 1.05] },
    approx: [3, 4, 5, 7],
  },
  es: {
    name: "Spanish",
    lang: "es",
    voices: { 1: ["em_alex", 0.95], 2: ["ef_dora", 1.1], 3: ["em_santa", 0.95], 4: ["ef_dora", 0.88], 5: ["em_alex", 0.92], 6: ["ef_dora", 1], 7: ["em_alex", 1.05] },
    approx: [4, 5, 7],
  },
  fr: {
    name: "French",
    lang: "fr",
    voices: { 1: ["ff_siwis", 0.95], 2: ["ff_siwis", 1.12], 3: ["ff_siwis", 0.92], 4: ["ff_siwis", 0.88], 5: ["ff_siwis", 0.9], 6: ["ff_siwis", 1], 7: ["ff_siwis", 1.05] },
    approx: [2, 3, 4, 5, 6, 7],
  },
  pt: {
    name: "Portuguese",
    lang: "pt-br",
    voices: { 1: ["pm_alex", 0.95], 2: ["pf_dora", 1.1], 3: ["pm_santa", 0.95], 4: ["pf_dora", 0.88], 5: ["pm_alex", 0.92], 6: ["pf_dora", 1], 7: ["pm_alex", 1.05] },
    approx: [4, 5, 7],
  },
  hi: {
    name: "Hindi",
    lang: "hi",
    voices: { 1: ["hm_omega", 0.95], 2: ["hf_alpha", 1.1], 3: ["hm_psi", 0.95], 4: ["hf_beta", 0.88], 5: ["hm_omega", 0.92], 6: ["hf_beta", 1], 7: ["hm_psi", 1.05] },
    approx: [5, 7],
  },
};

/** Languages the free voice speaks: English and Italian first-class, the rest best effort. */
export const KOKORO_LANGUAGES = Object.keys(LANGUAGES);

function setupFor(language: string): [string, LanguageSetup] {
  const base = language.toLowerCase().split("-")[0]!;
  const setup = LANGUAGES[base];
  if (!setup) throw new Error(`The free voice does not speak "${language}" yet. Supported: ${KOKORO_LANGUAGES.join(", ")}`);
  return [base, setup];
}

/** The Kokoro speaker and speed for a catalog voice type in a language. */
export function kokoroVoice(language: string, voiceType: number): KokoroVoice {
  const [, setup] = setupFor(language);
  const voice = setup.voices[voiceType];
  if (!voice) throw new Error(`Voice ${voiceType} has no free speaker; the free voice covers voice types ${Object.keys(setup.voices).join(", ")}`);
  const [speaker, speed] = voice;
  const note = setup.approx.includes(voiceType) ? `The free voice has few ${setup.name} speakers, so voice ${voiceType} uses ${speaker} at ${speed}× speed.` : undefined;
  return { speaker, speed, ...(note ? { note } : {}) };
}

const engines = new Map<string, OfflineTts>();

async function engineFor(language: string, setup: LanguageSetup): Promise<OfflineTts> {
  const cached = engines.get(language);
  if (cached) return cached;
  const dir = await ensureModel(KOKORO_MODEL);
  const tts = new sherpa.OfflineTts({
    model: {
      kokoro: {
        model: join(dir, "model.int8.onnx"),
        voices: join(dir, "voices.bin"),
        tokens: join(dir, "tokens.txt"),
        dataDir: join(dir, "espeak-ng-data"),
        ...(setup.lexicon ? { lexicon: join(dir, setup.lexicon) } : {}),
        ...(setup.lang ? { lang: setup.lang } : {}),
      },
      numThreads: 2,
      provider: "cpu",
    },
    maxNumSentences: 1,
  });
  engines.set(language, tts);
  return tts;
}

export const kokoro: VoiceProvider = {
  id: "kokoro",
  isFree: true,
  available: () => true,
  describeVoice: (language, voiceType) => {
    const { speaker, speed, note } = kokoroVoice(language, voiceType);
    return { id: `${speaker}@${speed}`, ...(note ? { note } : {}) };
  },
  async synthesize(text, { language, voiceType, outPath }) {
    const [base, setup] = setupFor(language);
    const voice = kokoroVoice(language, voiceType);
    const tts = await engineFor(base, setup);
    const audio = tts.generate({ text, sid: SPEAKERS.indexOf(voice.speaker), speed: voice.speed });
    mkdirSync(dirname(outPath), { recursive: true });
    sherpa.writeWave(outPath, audio);
    return { wavPath: outPath, durationSec: audio.samples.length / audio.sampleRate, provider: "kokoro" };
  },
};
