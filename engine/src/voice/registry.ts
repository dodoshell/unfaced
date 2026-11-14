import { kokoro } from "./kokoro.js";
import type { VoiceProvider } from "./types.js";

interface PaidProvider {
  name: string;
  envKey: string;
  /** Undefined until the provider is built. */
  provider?: VoiceProvider;
}

const FREE = kokoro;

const PAID: Record<string, PaidProvider> = {
  elevenlabs: { name: "ElevenLabs", envKey: "ELEVENLABS_API_KEY" },
};

/**
 * Picks the voice provider a page asked for. A paid provider without its key,
 * or one not built yet, falls back to the free voice and says so through `warn`.
 */
export function getVoiceProvider(requested: string, env: NodeJS.ProcessEnv, warn: (msg: string) => void): VoiceProvider {
  if (requested === "free") return FREE;
  const paid = PAID[requested];
  if (!paid) {
    throw new Error(`Unknown voice provider "${requested}". Choose one of: free, ${Object.keys(PAID).join(", ")}`);
  }
  if (!env[paid.envKey]) {
    warn(`${paid.name} needs ${paid.envKey} in .env; using the free voice instead.`);
    return FREE;
  }
  if (!paid.provider) {
    warn(`${paid.name} voice is not available yet in this version; using the free voice instead.`);
    return FREE;
  }
  return paid.provider;
}
