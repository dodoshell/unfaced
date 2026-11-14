import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");
const launcher = join(root, "plugin", "launcher", "unfaced.mjs");
const SKILLS = ["page-setup", "video-ideas", "video-recommend", "video-make", "video-package", "page-results"];

/** Runs a copy of the launcher with a clean environment (no UNFACED_* from the developer's shell). */
function launch(script: string, args: string[], env: Record<string, string> = {}, cwd = tmpdir()) {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("UNFACED_")));
  const r = spawnSync(process.execPath, [script, ...args], { cwd, env: { ...clean, ...env }, encoding: "utf8" });
  return { status: r.status, stdout: r.stdout.trim(), stderr: r.stderr };
}

/** A copy of the launcher in a folder that is not inside any checkout. */
function outsideCopy(): { dir: string; script: string } {
  const dir = mkdtempSync(join(tmpdir(), "unfaced launcher "));
  mkdirSync(join(dir, "skill", "scripts"), { recursive: true });
  const script = join(dir, "skill", "scripts", "unfaced.mjs");
  copyFileSync(launcher, script);
  return { dir, script };
}

/** The files that make a folder look like an unfaced library, without its dependencies. */
function fakeLibrary(dir: string): void {
  mkdirSync(join(dir, "engine", "src"), { recursive: true });
  mkdirSync(join(dir, "catalog"), { recursive: true });
  writeFileSync(join(dir, "engine", "src", "cli.ts"), "");
  writeFileSync(join(dir, "catalog", "catalog.json"), "{}");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "unfaced" }));
}

describe("the skills' launcher", () => {
  it("is copied, unchanged, into the scripts/ folder of every skill", () => {
    expect(readdirSync(join(root, "plugin", "skills")).filter((d) => !d.startsWith(".")).sort()).toEqual([...SKILLS].sort());
    for (const skill of SKILLS) {
      const copy = join(root, "plugin", "skills", skill, "scripts", "unfaced.mjs");
      expect(existsSync(copy), skill).toBe(true);
      expect(readFileSync(copy, "utf8"), `${skill}: copy plugin/launcher/unfaced.mjs again`).toBe(readFileSync(launcher, "utf8"));
    }
  });

  it("asks for the same library version as the plugin and the package", () => {
    const version = /const VERSION = "([^"]+)"/.exec(readFileSync(launcher, "utf8"))?.[1];
    expect(version).toBe(JSON.parse(readFileSync(join(root, "plugin", ".claude-plugin", "plugin.json"), "utf8")).version);
    expect(version).toBe(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version);
  });

  it("uses the checkout it lives in", () => {
    expect(launch(launcher, ["where"])).toMatchObject({ status: 0, stdout: root });
  });

  it("uses the checkout the user is working in", () => {
    const { script } = outsideCopy();
    expect(launch(script, ["where"], {}, join(root, "examples"))).toMatchObject({ status: 0, stdout: root });
  });

  it("uses UNFACED_LIB when it is set, and refuses a folder that is not a library", () => {
    const { script, dir } = outsideCopy();
    expect(launch(script, ["where"], { UNFACED_LIB: root })).toMatchObject({ status: 0, stdout: root });
    const wrong = launch(script, ["where"], { UNFACED_LIB: dir });
    expect(wrong.status).toBe(1);
    expect(wrong.stderr).toContain("not an unfaced checkout");
  });

  it("outside a checkout, uses the library installed for its version in UNFACED_HOME", () => {
    const { script, dir } = outsideCopy();
    const lib = join(dir, "home", "lib", "0.1.0");
    fakeLibrary(lib);
    expect(launch(script, ["where"], { UNFACED_HOME: join(dir, "home") })).toMatchObject({ status: 0, stdout: lib });
    const noDeps = launch(script, ["list", "hook"], { UNFACED_HOME: join(dir, "home") });
    expect(noDeps.status).toBe(1);
    expect(noDeps.stderr).toContain("no dependencies installed");
  });

  it("explains a download that fails and leaves nothing half-installed", () => {
    const { script, dir } = outsideCopy();
    const r = launch(script, ["list", "hook"], { UNFACED_HOME: join(dir, "home"), UNFACED_REPO: join(dir, "no-such-repo") });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/could not download[\s\S]*UNFACED_LIB/);
    expect(existsSync(join(dir, "home", "lib", "0.1.0"))).toBe(false);
    expect(existsSync(join(dir, "home", "lib", "0.1.0.partial"))).toBe(false);
  });

  it("runs the library's CLI with the arguments it was given", () => {
    const r = launch(launcher, ["list", "hook"]);
    expect(r.status).toBe(0);
    expect(r.stdout.split(/\r?\n/)).toHaveLength(15);
    expect(r.stdout).toMatch(/^01 {2}Shocking question/);
  });
});
