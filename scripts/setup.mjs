// One-time setup: installs the npm dependencies, then downloads the voice model,
// whisper.cpp with its models and Remotion's browser into ~/.unfaced/ (or $UNFACED_HOME).
// Usage: node scripts/setup.mjs
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (args) => {
  // npm is a .cmd script on Windows, which needs a shell to start.
  const result = spawnSync("npm", args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(["install"]);
run(["run", "unfaced", "--", "setup"]);
