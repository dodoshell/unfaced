import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");

function run(env: Record<string, string>) {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("UNFACED_")));
  return spawnSync(process.execPath, ["--import", "tsx", join(root, "engine", "src", "cli.ts"), "make", join(root, "no such video")], {
    cwd: root,
    env: { ...clean, ...env },
    encoding: "utf8",
  });
}

describe("a command that fails", () => {
  it("prints only the error's message and exits 1", () => {
    const r = run({});
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("script.md not found");
    expect(r.stderr).not.toMatch(/\n\s+at /);
  });

  it("prints the stack too when UNFACED_DEBUG is set", () => {
    const r = run({ UNFACED_DEBUG: "1" });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/script\.md not found[\s\S]*\n\s+at .*make\.ts/);
  });
});
