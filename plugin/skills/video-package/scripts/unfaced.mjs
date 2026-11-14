#!/usr/bin/env node
// The unfaced command for the skills: finds the unfaced library (engine + catalog), installs
// it on first use, and runs its CLI. Every skill carries an identical copy in scripts/, so a
// skill works on its own; edit plugin/launcher/unfaced.mjs and copy it (a test checks).
//
// Usage: node unfaced.mjs <command> [args]     any `unfaced` command (list, make, check, ...)
//        node unfaced.mjs where                prints the library folder it uses
//
// Where the library comes from, first match wins:
//   1. $UNFACED_LIB, a folder holding the library;
//   2. a checkout of the unfaced repository containing the current folder or this script;
//   3. ~/.unfaced/lib/<version> ($UNFACED_HOME instead of ~/.unfaced), cloned from the release
//      tag and installed the first time it is needed.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The library version this plugin works with; equal to plugin.json and package.json (a test checks). */
const VERSION = "0.1.0";
const REPO = process.env.UNFACED_REPO || "https://github.com/dodoshell/unfaced.git";

const say = (line) => process.stderr.write(`unfaced: ${line}\n`);

function isLibrary(dir) {
  if (!existsSync(join(dir, "engine", "src", "cli.ts")) || !existsSync(join(dir, "catalog", "catalog.json"))) return false;
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name === "unfaced";
  } catch {
    return false;
  }
}

function checkoutAbove(start) {
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    if (isLibrary(dir)) return dir;
    if (dirname(dir) === dir) return undefined;
  }
}

const hasDependencies = (lib) => existsSync(join(lib, "node_modules", "tsx", "dist", "loader.mjs"));

function run(command, args, cwd) {
  // npm and git can be .cmd scripts on Windows, which need a shell to start.
  const result = spawnSync(command, args, { cwd, stdio: ["ignore", "inherit", "inherit"], shell: process.platform === "win32" });
  return result.status === 0;
}

/** Clones the release into ~/.unfaced/lib/<version> and installs it; exits with advice on failure. */
function install(target) {
  const tmp = `${target}.partial`;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  say(`installing the unfaced library ${VERSION} into ${target} (first use only; a few minutes)`);
  if (!run("git", ["clone", "--quiet", "--depth", "1", "--branch", `v${VERSION}`, REPO, tmp])) {
    rmSync(tmp, { recursive: true, force: true });
    say(`could not download ${REPO} (tag v${VERSION}) with git clone.`);
    say("Check that git is installed and that you can reach GitHub, or clone the repository yourself and set UNFACED_LIB to its folder.");
    process.exit(1);
  }
  if (!run("npm", ["install", "--no-audit", "--no-fund"], tmp)) {
    say(`npm install failed in ${tmp}; fix the error above and run this command again.`);
    process.exit(1);
  }
  renameSync(tmp, target);
  // The voice model, whisper and the render browser.
  if (!cli(target, ["setup"])) say("setup did not finish; run `unfaced doctor` to see what is missing.");
}

function findLibrary() {
  const fromEnv = process.env.UNFACED_LIB;
  if (fromEnv) {
    if (!isLibrary(fromEnv)) {
      say(`UNFACED_LIB is set to ${fromEnv}, which is not an unfaced checkout (no engine/src/cli.ts).`);
      process.exit(1);
    }
    return { lib: resolve(fromEnv), installed: false };
  }
  const checkout = checkoutAbove(process.cwd()) ?? checkoutAbove(dirname(fileURLToPath(import.meta.url)));
  if (checkout) return { lib: checkout, installed: false };
  const home = process.env.UNFACED_HOME || join(homedir(), ".unfaced");
  return { lib: join(home, "lib", VERSION), installed: true };
}

function cli(lib, args) {
  const loader = pathToFileURL(join(lib, "node_modules", "tsx", "dist", "loader.mjs")).href;
  const result = spawnSync(process.execPath, ["--import", loader, join(lib, "engine", "src", "cli.ts"), ...args], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  return result.status === 0;
}

const args = process.argv.slice(2);
const { lib, installed } = findLibrary();
if (args[0] === "where") {
  console.log(lib);
} else if (args[0] === "--version") {
  console.log(VERSION);
} else {
  if (installed && !isLibrary(lib)) install(lib);
  if (!hasDependencies(lib)) {
    say(`the unfaced library at ${lib} has no dependencies installed; run \`npm run setup\` in that folder.`);
    process.exit(1);
  }
  cli(lib, args);
}
