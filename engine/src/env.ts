// Keys for the paid providers live in .env files, never in page.yaml.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseEnv } from "node:util";
import { unfacedHome } from "./paths.js";

/** Every variable the paid providers read; all optional, since each falls back to a free path. */
export const PROVIDER_KEYS = [
  { name: "ELEVENLABS_API_KEY", use: "ElevenLabs voice (providers.voice: elevenlabs)" },
  { name: "REPLICATE_API_TOKEN", use: "Replicate images and clips (providers.images or providers.ai_clips: replicate)" },
  { name: "PEXELS_API_KEY", use: "Pexels stock photos (providers.images: pexels; the key is free)" },
] as const;

interface EnvOptions {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

/**
 * The environment with the variables of `<pageDir>/.env`, then `./.env`, then `~/.unfaced/.env`
 * added, the nearest file winning and a variable already set never overridden. An empty value
 * counts as unset, so a copied .env.example with blank lines does not hide a key set further away.
 * Returns a copy; the given environment is left as it is.
 */
export function loadEnv(pageDir?: string, { env = process.env, cwd = process.cwd() }: EnvOptions = {}): NodeJS.ProcessEnv {
  const loaded: NodeJS.ProcessEnv = { ...env };
  const files = [...(pageDir ? [join(pageDir, ".env")] : []), join(cwd, ".env"), join(unfacedHome(env), ".env")];
  for (const file of new Set(files.map((f) => resolve(f)))) {
    if (!existsSync(file)) continue;
    for (const [name, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
      if (value && !loaded[name]) loaded[name] = value;
    }
  }
  return loaded;
}

/** The environment for a video's providers: {@link loadEnv} with its page, two folders up. */
export const videoEnv = (videoDir: string, options: EnvOptions = {}): NodeJS.ProcessEnv => loadEnv(resolve(videoDir, "..", ".."), options);
