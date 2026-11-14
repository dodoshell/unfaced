import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The root of the unfaced library (engine + catalog). */
export const LIBRARY_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CATALOG_DIR = join(LIBRARY_ROOT, "catalog");

/** Where unfaced keeps downloaded models and tools: `$UNFACED_HOME`, or `~/.unfaced`. */
export function unfacedHome(env: NodeJS.ProcessEnv = process.env): string {
  return env.UNFACED_HOME || join(homedir(), ".unfaced");
}
