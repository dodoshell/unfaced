import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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

/** A git repo tagged v0.1.0 to install from with UNFACED_REPO; its postinstall points tsx at this checkout's, so nothing is downloaded. */
function releaseRepo(dir: string, cli = 'console.log(`ran ${process.argv.slice(2).join(" ")}`);\n'): string {
  const repo = join(dir, "unfaced repo");
  fakeLibrary(repo);
  writeFileSync(join(repo, "engine", "src", "cli.ts"), cli);
  const loader = `import ${JSON.stringify(pathToFileURL(join(root, "node_modules", "tsx", "dist", "loader.mjs")).href)};\n`;
  writeFileSync(
    join(repo, "tsx.mjs"),
    `import { mkdirSync, writeFileSync } from "node:fs";\nmkdirSync("node_modules/tsx/dist", { recursive: true });\nwriteFileSync("node_modules/tsx/dist/loader.mjs", ${JSON.stringify(loader)});\n`,
  );
  writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "unfaced", private: true, scripts: { postinstall: "node tsx.mjs" } }));
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args], { cwd: repo, stdio: "ignore" });
  git("init", "--quiet");
  git("add", ".");
  git("commit", "--quiet", "-m", "release");
  git("tag", "v0.1.0");
  return repo;
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

  it("never runs a library found around the current folder, which may be anyone's code", () => {
    const { script, dir } = outsideCopy();
    const home = join(dir, "home");
    const installed = join(home, "lib", "0.1.0");
    fakeLibrary(installed);
    const untrusted = join(dir, "downloaded repo");
    fakeLibrary(untrusted);
    mkdirSync(join(untrusted, "sub"));
    expect(launch(script, ["where"], { UNFACED_HOME: home }, join(untrusted, "sub"))).toMatchObject({ status: 0, stdout: installed });
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

  it("installs the release on first use, into a home folder whose path has spaces, and runs the command", () => {
    const { script, dir } = outsideCopy();
    const home = join(dir, "home with spaces");
    const r = launch(script, ["list", "hook"], { UNFACED_HOME: home, UNFACED_REPO: releaseRepo(dir) });
    expect(r.stderr).not.toContain("could not download");
    expect(r.stderr).not.toContain("detached HEAD");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ran setup");
    expect(r.stdout).toMatch(/ran list hook$/);
    expect(existsSync(join(home, "lib", "0.1.0", "engine", "src", "cli.ts"))).toBe(true);
    expect(existsSync(join(home, "lib", "0.1.0.partial"))).toBe(false);
  }, 60_000);

  it("explains an install it cannot move into place", () => {
    const { script, dir } = outsideCopy();
    const home = join(dir, "home");
    mkdirSync(join(home, "lib", "0.1.0"), { recursive: true });
    writeFileSync(join(home, "lib", "0.1.0", "notes.txt"), "not a library");
    const r = launch(script, ["list", "hook"], { UNFACED_HOME: home, UNFACED_REPO: releaseRepo(dir) });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/could not move [\s\S]*0\.1\.0\.partial[\s\S]*run this command again/);
    expect(r.stderr).not.toMatch(/\n\s+at /);
  }, 60_000);

  it("keeps the command's own exit code when the first-use setup fails", () => {
    const { script, dir } = outsideCopy();
    const cli = 'if (process.argv[2] === "setup") process.exit(3);\nconsole.log("ran the command");\n';
    const r = launch(script, ["list", "hook"], { UNFACED_HOME: join(dir, "home"), UNFACED_REPO: releaseRepo(dir, cli) });
    expect(r.stderr).toContain("setup did not finish");
    expect(r.stdout).toContain("ran the command");
    expect(r.status).toBe(0);
  }, 60_000);

  it("tells the CLI where it is, so its advice can name the launcher", () => {
    const { script, dir } = outsideCopy();
    const cli = "console.log(`launcher=${process.env.UNFACED_LAUNCHER}`);\n";
    const r = launch(script, ["doctor"], { UNFACED_HOME: join(dir, "home"), UNFACED_REPO: releaseRepo(dir, cli) });
    expect(r.stdout).toContain(`launcher=${script}`);
  }, 60_000);

  it("runs the library's CLI with the arguments it was given", () => {
    const r = launch(launcher, ["list", "hook"]);
    expect(r.status).toBe(0);
    expect(r.stdout.split(/\r?\n/)).toHaveLength(15);
    expect(r.stdout).toMatch(/^01 {2}Shocking question/);
  });
});
