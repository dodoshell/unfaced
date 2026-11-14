import { homedir } from "node:os";
import { join } from "node:path";

/** Where unfaced keeps downloaded models and tools: `$UNFACED_HOME`, or `~/.unfaced`. */
export function unfacedHome(env: NodeJS.ProcessEnv = process.env): string {
  return env.UNFACED_HOME || join(homedir(), ".unfaced");
}
