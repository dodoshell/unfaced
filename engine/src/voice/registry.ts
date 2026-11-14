import { elevenLabs } from "./elevenlabs.js";
import { kokoro } from "./kokoro.js";
import type { VoiceProvider } from "./types.js";

interface PaidProvider {
  name: string;
  envKey: string;
  create(key: string): VoiceProvider;
}

const FREE = kokoro;

const PAID: Record<string, PaidProvider> = {
  elevenlabs: { name: "ElevenLabs", envKey: "ELEVENLABS_API_KEY", create: (key) => elevenLabs(key) },
};

/**
 * Picks the voice provider a page asked for. A paid provider without its key falls back to
 * the free voice and says so through `warn`; so does a paid call that fails.
 */
export function getVoiceProvider(requested: string, env: NodeJS.ProcessEnv, warn: (msg: string) => void): VoiceProvider {
  if (requested === "free") return FREE;
  const paid = PAID[requested];
  if (!paid) {
    throw new Error(`Unknown voice provider "${requested}". Choose one of: free, ${Object.keys(PAID).join(", ")}`);
  }
  const key = env[paid.envKey];
  if (!key) {
    warn(`${paid.name} needs ${paid.envKey} in .env; using the free voice instead.`);
    return FREE;
  }
  return withFreeVoice(paid.create(key), paid.name, warn);
}

/** The paid voice, with the free one standing in (and `warn` saying why) when a call fails, so the video still gets made. */
export function withFreeVoice(paid: VoiceProvider, name: string, warn: (msg: string) => void, free: VoiceProvider = FREE): VoiceProvider {
  return {
    ...paid,
    async synthesize(text, opts) {
      try {
        return await paid.synthesize(text, opts);
      } catch (e) {
        const why = (e instanceof Error ? e.message : String(e)).replace(/\.?$/, ".");
        warn(`${name} voice failed: ${why} Using the free voice instead.`);
        return free.synthesize(text, opts);
      }
    },
  };
}
