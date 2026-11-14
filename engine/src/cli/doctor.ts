import { spawnSync } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { dirname, join } from "node:path";
import { PROVIDER_KEYS } from "../env.js";
import { LIBRARY_ROOT, unfacedHome } from "../paths.js";
import { whisperPaths } from "../timing/align.js";
import { KOKORO_MODEL } from "../voice/kokoro.js";

export interface Check {
  name: string;
  ok: () => Promise<boolean>;
  /** What to run or do when the check fails. */
  fix: string;
}

const SETUP = "npm run setup";

/** The nearest folder that exists, for measuring free space before ~/.unfaced is created. */
function existingAncestor(path: string): string {
  let p = path;
  while (!existsSync(p) && dirname(p) !== p) p = dirname(p);
  return p;
}

/** True when `command --version` runs. */
const runs = (command: string) => spawnSync(command, ["--version"]).status === 0;

/**
 * On macOS and Linux whisper.cpp is built from source (git clone, then make), so its tools
 * are needed until it is built; Windows downloads a ready binary.
 */
function buildTools(executable: string, platform: NodeJS.Platform): Check[] {
  if (platform === "win32") return [];
  return [
    {
      name: "git, make and a C compiler (to build whisper)",
      ok: async () => existsSync(executable) || (runs("git") && runs("make") && ["cc", "gcc", "clang"].some(runs)),
      fix: platform === "darwin" ? "run xcode-select --install" : "install git, make and gcc (on Debian or Ubuntu: sudo apt install git build-essential)",
    },
  ];
}

export function defaultChecks(env: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform): Check[] {
  const home = unfacedHome(env);
  const whisper = whisperPaths("en", env);
  // English uses its own whisper model; every other language uses the multilingual one.
  const multilingual = whisperPaths("it", env);
  return [
    { name: "Node 22 or newer", ok: async () => Number(process.versions.node.split(".")[0]) >= 22, fix: "install Node 22 or newer from https://nodejs.org" },
    { name: "Free voice model", ok: async () => existsSync(join(home, "models", KOKORO_MODEL.name)), fix: SETUP },
    ...buildTools(whisper.executable, platform),
    { name: "Whisper", ok: async () => existsSync(whisper.executable), fix: SETUP },
    { name: "Whisper model for English", ok: async () => existsSync(whisper.modelFile), fix: SETUP },
    { name: "Whisper model for other languages", ok: async () => existsSync(multilingual.modelFile), fix: SETUP },
    { name: "Remotion browser", ok: async () => existsSync(join(LIBRARY_ROOT, "node_modules", ".remotion", "chrome-headless-shell")), fix: SETUP },
    { name: "tar", ok: async () => spawnSync("tar", ["--version"]).status === 0, fix: "install tar (it ships with Windows 10+, macOS and Linux)" },
    {
      name: "2 GB free disk space",
      ok: async () => {
        const s = statfsSync(existingAncestor(home));
        return s.bavail * s.bsize >= 2 * 1024 ** 3;
      },
      fix: `free some space on the drive of ${home}`,
    },
  ];
}

/** Which paid providers' keys are set: information only, since every feature works without them. Never prints a value. */
export function keyLines(env: NodeJS.ProcessEnv): string[] {
  return [
    "Optional paid providers (keys from .env; everything works without them):",
    ...PROVIDER_KEYS.map(({ name, use }) => `${(env[name] ? "set" : "not set").padEnd(8)} ${name} — ${use}`),
  ];
}

/** Runs every check, prints one line each, and returns the exit code: 0 if all pass. */
export async function runDoctor(checks: Check[], print: (line: string) => void = console.log): Promise<number> {
  let failed = 0;
  for (const check of checks) {
    let ok = false;
    try {
      ok = await check.ok();
    } catch {
      ok = false;
    }
    if (ok) {
      print(`ok       ${check.name}`);
    } else {
      failed++;
      print(`missing  ${check.name} — fix: ${check.fix}`);
    }
  }
  return failed === 0 ? 0 : 1;
}
