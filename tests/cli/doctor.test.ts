import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Check, defaultChecks, keyLines, runDoctor } from "../../engine/src/cli/doctor.js";
import { whisperPaths } from "../../engine/src/timing/align.js";

const checks = (ok: boolean): Check[] =>
  ["Node 22 or newer", "Free voice model", "Whisper", "Remotion browser", "2 GB free disk space"].map((name) => ({ name, ok: async () => ok, fix: `fix ${name}` }));

describe("doctor", () => {
  it("prints a missing line with its fix for every failed check and exits 1", async () => {
    const lines: string[] = [];
    const code = await runDoctor(checks(false), (l) => lines.push(l));
    expect(code).toBe(1);
    expect(lines.filter((l) => l.startsWith("missing"))).toHaveLength(5);
    expect(lines[1]).toContain("fix Free voice model");
  });

  it("prints ok for every passed check and exits 0", async () => {
    const lines: string[] = [];
    const code = await runDoctor(checks(true), (l) => lines.push(l));
    expect(code).toBe(0);
    expect(lines.filter((l) => l.startsWith("ok"))).toHaveLength(5);
  });

  it("counts a check that throws as missing", async () => {
    const lines: string[] = [];
    const code = await runDoctor([{ name: "Broken", ok: async () => { throw new Error("boom"); }, fix: "reinstall" }], (l) => lines.push(l));
    expect(code).toBe(1);
    expect(lines[0]).toMatch(/^missing.*Broken.*reinstall/);
  });

  it("has a default check for each thing the free pipeline needs", () => {
    expect(defaultChecks({}, "win32").map((c) => c.name)).toEqual([
      "Node 22 or newer",
      "Free voice model",
      "Whisper",
      "Whisper model for English",
      "Whisper model for other languages",
      "Remotion browser",
      "tar",
      "2 GB free disk space",
    ]);
  });

  it("checks the tools that build whisper on macOS and Linux, where it is compiled from source", () => {
    for (const platform of ["darwin", "linux"] as const) {
      const names = defaultChecks({}, platform).map((c) => c.name);
      expect(names).toContain("git, make and a C compiler (to build whisper)");
    }
  });

  it("lists which paid providers' keys are set, as information, never their values", () => {
    const lines = keyLines({ ELEVENLABS_API_KEY: "secret-value-1", PEXELS_API_KEY: "" });
    expect(lines).toEqual([
      "Optional paid providers (keys from .env; everything works without them):",
      "set      ELEVENLABS_API_KEY — ElevenLabs voice (providers.voice: elevenlabs)",
      "not set  REPLICATE_API_TOKEN — Replicate images and clips (providers.images or providers.ai_clips: replicate)",
      "not set  PEXELS_API_KEY — Pexels stock photos (providers.images: pexels; the key is free)",
    ]);
    expect(lines.join("\n")).not.toContain("secret-value-1");
  });

  it("passes the build tools check once whisper is built, whatever is installed", async () => {
    const home = mkdtempSync(join(tmpdir(), "unfaced doctor "));
    const exe = whisperPaths("en", { UNFACED_HOME: home }).executable;
    mkdirSync(dirname(exe), { recursive: true });
    writeFileSync(exe, "");
    const build = defaultChecks({ UNFACED_HOME: home, PATH: "" }, "linux").find((c) => c.name.startsWith("git, make"))!;
    expect(await build.ok()).toBe(true);
  });
});
