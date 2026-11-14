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
//   2. the checkout of the unfaced repository this script lives in (never one found around the
//      current folder: that may be anyone's code, and running it would run their code);
//   3. ~/.unfaced/lib/<version> ($UNFACED_HOME instead of ~/.unfaced), cloned from the release
//      tag and installed the first time it is needed.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The library version this plugin works with; equal to plugin.json and package.json (a test checks). */
const VERSION = "0.1.3";
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

/** Runs git without a shell, so its paths reach it whole, spaces and all. */
function git(args) {
  return spawnSync("git", args, { stdio: ["ignore", "inherit", "inherit"] }).status === 0;
}

function npmInstall(cwd) {
  // npm is a .cmd script on Windows, which needs a shell to start; the folder goes in cwd, so the command holds no path to split.
  return spawnSync("npm install --no-audit --no-fund", { cwd, stdio: ["ignore", "inherit", "inherit"], shell: true }).status === 0;
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Renames a folder, trying again for a moment: on Windows a virus scanner often holds new files. */
function moveInto(from, to) {
  for (let attempt = 1; ; attempt++) {
    try {
      renameSync(from, to);
      return true;
    } catch (err) {
      if (attempt === 5) {
        say(`could not move ${from} to ${to} (${err.code ?? err.message}).`);
        say(`If ${to} exists, delete it. If a virus scanner is checking the new files, wait a moment. Then run this command again.`);
        return false;
      }
      sleep(attempt * 250);
    }
  }
}

/** Whether the process that took `lock` is gone (or never wrote its id within a minute). */
function abandoned(lock) {
  try {
    process.kill(Number(readFileSync(join(lock, "pid"), "utf8")), 0);
    return false;
  } catch (err) {
    if (err.code === "EPERM") return false;
    if (err.code === "ESRCH") return true;
    try {
      return Date.now() - statSync(lock).mtimeMs > 60_000;
    } catch {
      return false;
    }
  }
}

/**
 * Takes the install lock, a folder next to the library (making a folder either succeeds or
 * finds it there, in one step). While another command holds it, waits; returns false when that
 * command installed the library meanwhile.
 */
function lockInstall(target) {
  const lock = `${target}.lock`;
  for (let told = false; ; ) {
    try {
      mkdirSync(lock);
      writeFileSync(join(lock, "pid"), String(process.pid));
      if (!isLibrary(target)) return true;
      // Another command installed it while this one waited.
      rmSync(lock, { recursive: true, force: true });
      return false;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
    if (abandoned(lock)) {
      rmSync(lock, { recursive: true, force: true });
      continue;
    }
    if (!told) say("another unfaced command is installing the library; waiting for it to finish");
    told = true;
    sleep(1000);
  }
}

/** Clones the release into ~/.unfaced/lib/<version> and installs it; exits with advice on failure. */
function install(target) {
  mkdirSync(dirname(target), { recursive: true });
  if (!lockInstall(target)) return;
  const lock = `${target}.lock`;
  const fail = () => {
    rmSync(lock, { recursive: true, force: true });
    process.exit(1);
  };
  const tmp = `${target}.partial`;
  rmSync(tmp, { recursive: true, force: true });
  say(`installing the unfaced library ${VERSION} into ${target} (first use only; a few minutes)`);
  if (!git(["-c", "advice.detachedHead=false", "clone", "--quiet", "--depth", "1", "--branch", `v${VERSION}`, REPO, tmp])) {
    rmSync(tmp, { recursive: true, force: true });
    say(`could not download ${REPO} (tag v${VERSION}) with git clone.`);
    say("Check that git is installed and that you can reach GitHub, or clone the repository yourself and set UNFACED_LIB to its folder.");
    fail();
  }
  if (!npmInstall(tmp)) {
    say(`npm install failed in ${tmp}; fix the error above and run this command again.`);
    fail();
  }
  if (!moveInto(tmp, target)) fail();
  // The voice model, whisper and the render browser, before another command can use the library.
  if (cli(target, ["setup"]) !== 0) say("setup did not finish; run `unfaced doctor` to see what is missing.");
  rmSync(lock, { recursive: true, force: true });
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
  const checkout = checkoutAbove(dirname(fileURLToPath(import.meta.url)));
  if (checkout) return { lib: checkout, installed: false };
  const home = process.env.UNFACED_HOME || join(homedir(), ".unfaced");
  return { lib: join(home, "lib", VERSION), installed: true };
}

/** Runs the library's CLI and returns its exit code; UNFACED_LAUNCHER lets its advice name this script. */
function cli(lib, args) {
  const loader = pathToFileURL(join(lib, "node_modules", "tsx", "dist", "loader.mjs")).href;
  const env = { ...process.env, UNFACED_LAUNCHER: fileURLToPath(import.meta.url) };
  return spawnSync(process.execPath, ["--import", loader, join(lib, "engine", "src", "cli.ts"), ...args], { stdio: "inherit", env }).status ?? 1;
}

if (Number(process.versions.node.split(".")[0]) < 22) {
  say(`needs Node 22 or newer; this is Node ${process.versions.node}. Install it from https://nodejs.org and run this command again.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const { lib, installed } = findLibrary();
if (args[0] === "where") {
  console.log(lib);
} else if (args[0] === "--version") {
  console.log(VERSION);
} else {
  if (installed && (!isLibrary(lib) || existsSync(`${lib}.lock`))) install(lib);
  if (!hasDependencies(lib)) {
    say(`the unfaced library at ${lib} has no dependencies installed; run \`npm run setup\` in that folder.`);
    process.exit(1);
  }
  process.exitCode = cli(lib, args);
}
