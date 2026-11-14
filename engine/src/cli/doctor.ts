import { spawnSync } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { dirname, join } from "node:path";
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

export function defaultChecks(env: NodeJS.ProcessEnv = process.env): Check[] {
  const home = unfacedHome(env);
  const whisper = whisperPaths("en", env);
  return [
    { name: "Node 22 or newer", ok: async () => Number(process.versions.node.split(".")[0]) >= 22, fix: "install Node 22 or newer from https://nodejs.org" },
    { name: "Free voice model", ok: async () => existsSync(join(home, "models", KOKORO_MODEL.name)), fix: SETUP },
    { name: "Whisper", ok: async () => existsSync(whisper.executable) && existsSync(whisper.modelFile), fix: SETUP },
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
