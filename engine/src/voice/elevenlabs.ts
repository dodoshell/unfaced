import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { encodeWav } from "../audio/speech.js";
import type { VoiceProvider } from "./types.js";

/** Speaks every language ElevenLabs supports from the same voices, so no per-language table is needed. */
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/** 16-bit mono PCM at 24 kHz: the highest PCM rate every plan gets (44.1 kHz needs Pro). */
const SAMPLE_RATE = 24000;

/**
 * A voice from ElevenLabs's own library for each catalog voice type (1-7; 8 is text only), with
 * the speed it reads at (voice_settings.speed, 0.7-1.2). They are the replacements ElevenLabs
 * names for its older default voices, which stop working on 31 December 2026:
 * https://elevenlabs.io/docs/help-center/product/voices/my-voices/what-are-default-voices
 */
export const ELEVENLABS_VOICES: Record<number, { name: string; id: string; speed: number }> = {
  1: { name: "Eldrin - Crisp British Baritone", id: "6WwXjDDEMyNmFG95zycZ", speed: 0.95 },
  2: { name: "Jade - Upbeat and Natural", id: "g7LVvkPWALzPxOQbF6OE", speed: 1.1 },
  3: { name: "Darian - Warm Grounded Storyteller", id: "gOupLcAkjEnguROwi4oS", speed: 0.95 },
  4: { name: "Talia - Warm Soft Guide", id: "OZ0L6eISlOejga3XjDFt", speed: 0.9 },
  5: { name: "Baxter - Dry Calm Aussie", id: "jSuBIjxMKhqIfb0wCK1F", speed: 0.95 },
  6: { name: "Maisie - Friendly Casual Neighbor", id: "QtY3JBOUKEB5xzrRfOKc", speed: 1 },
  7: { name: "Finley - Articulate Anchor", id: "fnYMz3F5gMEDGMWcH1ex", speed: 1.05 },
};

function voiceFor(voiceType: number) {
  const voice = ELEVENLABS_VOICES[voiceType];
  if (!voice) throw new Error(`Voice ${voiceType} has no ElevenLabs voice; ElevenLabs covers voice types ${Object.keys(ELEVENLABS_VOICES).join(", ")}`);
  return voice;
}

/**
 * One text-to-speech call; resolves with the raw PCM.
 * https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */
async function textToSpeech(text: string, voiceId: string, speed: number, apiKey: string, fetchImpl: typeof fetch): Promise<Buffer> {
  let res: Response;
  try {
    res = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_${SAMPLE_RATE}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL, voice_settings: { speed } }),
    });
  } catch (e) {
    throw new Error(`Could not reach ElevenLabs: ${reason(e)}`);
  }
  if (!res.ok) throw new Error(await refusal(res));
  return Buffer.from(await res.arrayBuffer());
}

const reason = (e: unknown): string => {
  const err = e instanceof Error ? e : new Error(String(e));
  return err.cause instanceof Error ? `${err.message} (${err.cause.message})` : err.message;
};

/** What a refused call means, from its status and the `detail` ElevenLabs sends back. */
async function refusal(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { detail?: unknown };
  const detail = body.detail as { status?: string; message?: string } | { msg?: string }[] | string | undefined;
  const status = typeof detail === "object" && !Array.isArray(detail) ? detail.status : undefined;
  const message = Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : typeof detail === "string" ? detail : (detail?.message ?? res.statusText);
  if (status === "quota_exceeded") return `ElevenLabs quota used up: ${message}`;
  if (res.status === 401) return `ElevenLabs refused ELEVENLABS_API_KEY (401): check the key in .env. ${message}`;
  if (res.status === 429) return `ElevenLabs rate limit (429): ${message} Wait a little and make the video again.`;
  return `ElevenLabs answered ${res.status}: ${message}`;
}

/** The ElevenLabs voice, speaking with `apiKey`. */
export function elevenLabs(apiKey: string, fetchImpl: typeof fetch = fetch): VoiceProvider {
  return {
    id: "elevenlabs",
    isFree: false,
    available: () => true,
    describeVoice: (_language, voiceType) => {
      const { id, speed } = voiceFor(voiceType);
      return { id: `${id}@${speed}` };
    },
    async synthesize(text, { voiceType, outPath }) {
      const { id, speed } = voiceFor(voiceType);
      const pcm = await textToSpeech(text, id, speed, apiKey, fetchImpl);
      const samples = new Float32Array(pcm.length >> 1);
      for (let i = 0; i < samples.length; i++) samples[i] = pcm.readInt16LE(2 * i) / 32768;
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, encodeWav({ samples, rate: SAMPLE_RATE }));
      return { wavPath: outPath, durationSec: samples.length / SAMPLE_RATE, provider: "elevenlabs" };
    },
  };
}
