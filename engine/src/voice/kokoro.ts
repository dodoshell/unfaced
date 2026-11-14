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

interface Voice {
  speaker: string;
  speed: number;
}

interface LanguageSetup {
  /** espeak-ng language; English reads best without one, through the lexicon. */
  lang?: string;
  lexicon?: string;
  /** Voices by catalog voice number. */
  voices: Partial<Record<number, Voice>>;
}

// English and Italian are first-class; the others are best effort (Kokoro's native voice for that language).
const LANGUAGES: Record<string, LanguageSetup> = {
  en: { lexicon: "lexicon-gb-en.txt", voices: { 1: { speaker: "bm_george", speed: 0.95 } } },
  it: { lang: "it", voices: { 1: { speaker: "im_nicola", speed: 0.95 } } },
  es: { lang: "es", voices: { 1: { speaker: "em_alex", speed: 0.95 } } },
  fr: { lang: "fr", voices: { 1: { speaker: "ff_siwis", speed: 0.95 } } },
  pt: { lang: "pt-br", voices: { 1: { speaker: "pm_alex", speed: 0.95 } } },
  hi: { lang: "hi", voices: { 1: { speaker: "hm_omega", speed: 0.95 } } },
};

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
  async synthesize(text, { language, voiceType, outPath }) {
    const base = language.toLowerCase().split("-")[0]!;
    const setup = LANGUAGES[base];
    if (!setup) {
      throw new Error(`The free voice does not speak "${language}" yet. Supported: ${Object.keys(LANGUAGES).join(", ")}`);
    }
    const voice = setup.voices[voiceType];
    if (!voice) {
      const ready = Object.keys(setup.voices).join(", ");
      throw new Error(`Voice ${voiceType} is not ready yet in the free voice; ready voices: ${ready}`);
    }
    const tts = await engineFor(base, setup);
    const audio = tts.generate({ text, sid: SPEAKERS.indexOf(voice.speaker), speed: voice.speed });
    mkdirSync(dirname(outPath), { recursive: true });
    sherpa.writeWave(outPath, audio);
    return { wavPath: outPath, durationSec: audio.samples.length / audio.sampleRate, provider: "kokoro" };
  },
};
