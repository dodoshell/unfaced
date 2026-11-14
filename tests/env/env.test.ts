import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEnv, PROVIDER_KEYS, videoEnv } from "../../engine/src/env.js";

/** A page folder, a separate current folder and an unfaced home, each with its own .env. */
function folders(files: { page?: string; cwd?: string; home?: string }) {
  const root = mkdtempSync(join(tmpdir(), "unfaced env "));
  const page = join(root, "my page");
  const cwd = join(root, "somewhere else");
  const home = join(root, "home", ".unfaced");
  for (const [dir, text] of [[page, files.page], [cwd, files.cwd], [home, files.home]] as const) {
    mkdirSync(dir, { recursive: true });
    if (text !== undefined) writeFileSync(join(dir, ".env"), text);
  }
  return { page, cwd, home };
}

describe("loadEnv", () => {
  it("reads the page's .env, then the current folder's, then ~/.unfaced/.env, the nearest winning", () => {
    const { page, cwd, home } = folders({
      page: "ELEVENLABS_API_KEY=from-page\n",
      cwd: "ELEVENLABS_API_KEY=from-cwd\nREPLICATE_API_TOKEN=from-cwd\n",
      home: "ELEVENLABS_API_KEY=from-home\nREPLICATE_API_TOKEN=from-home\nPEXELS_API_KEY=from-home\n",
    });
    const env = loadEnv(page, { env: { UNFACED_HOME: home }, cwd });
    expect(env).toMatchObject({ ELEVENLABS_API_KEY: "from-page", REPLICATE_API_TOKEN: "from-cwd", PEXELS_API_KEY: "from-home" });
  });

  it("never overrides a variable that is already set, and leaves the given environment as it is", () => {
    const { page, cwd, home } = folders({ page: "ELEVENLABS_API_KEY=from-page\n# a comment\nPEXELS_API_KEY=\"quoted value\"\n" });
    const given = { UNFACED_HOME: home, ELEVENLABS_API_KEY: "already set" };
    const env = loadEnv(page, { env: given, cwd });
    expect(env.ELEVENLABS_API_KEY).toBe("already set");
    expect(env.PEXELS_API_KEY).toBe("quoted value");
    expect(given).toEqual({ UNFACED_HOME: home, ELEVENLABS_API_KEY: "already set" });
  });

  it("lets an empty value in a nearer .env (a copied .env.example) leave the key to a farther one", () => {
    const { page, cwd, home } = folders({ page: "ELEVENLABS_API_KEY=\nREPLICATE_API_TOKEN=\n", home: "ELEVENLABS_API_KEY=from-home\n" });
    const env = loadEnv(page, { env: { UNFACED_HOME: home }, cwd });
    expect(env.ELEVENLABS_API_KEY).toBe("from-home");
    expect(env.REPLICATE_API_TOKEN).toBeUndefined();
  });

  it("reads a .env saved with a byte order mark or in UTF-16, as Windows editors and PowerShell 5.1 write it", () => {
    const text = "ELEVENLABS_API_KEY=key-one\r\nPEXELS_API_KEY=key-two\r\n";
    const utf16 = (body: string, bigEndian: boolean) => {
      const le = Buffer.from(`﻿${body}`, "utf16le");
      return bigEndian ? Buffer.from(le).swap16() : le;
    };
    for (const [label, bytes] of [
      ["UTF-8 with BOM", Buffer.from(`﻿${text}`, "utf8")],
      ["UTF-16 LE", utf16(text, false)],
      ["UTF-16 BE", utf16(text, true)],
    ] as const) {
      const { page, cwd, home } = folders({});
      writeFileSync(join(page, ".env"), bytes);
      expect(loadEnv(page, { env: { UNFACED_HOME: home }, cwd }), label).toMatchObject({ ELEVENLABS_API_KEY: "key-one", PEXELS_API_KEY: "key-two" });
    }
  });

  it("works without any .env file, and without a page", () => {
    const { page, cwd, home } = folders({ cwd: "PEXELS_API_KEY=from-cwd\n" });
    expect(loadEnv(page, { env: { UNFACED_HOME: home, PATH: "x" }, cwd })).toEqual({ UNFACED_HOME: home, PATH: "x", PEXELS_API_KEY: "from-cwd" });
    expect(loadEnv(undefined, { env: { UNFACED_HOME: home }, cwd }).PEXELS_API_KEY).toBe("from-cwd");
  });
});

describe(".env.example", () => {
  const lines = readFileSync(join(import.meta.dirname, "..", "..", ".env.example"), "utf8").split(/\r?\n/);

  it.each(PROVIDER_KEYS.map((k) => k.name))("lists %s without a value, under a comment", (name) => {
    const at = lines.indexOf(`${name}=`);
    expect(at, `${name}= in .env.example`).toBeGreaterThan(0);
    expect(lines[at - 1]).toMatch(/^# /);
  });

  it("holds no values at all", () => {
    expect(lines.filter((l) => /^[A-Z_]+=./.test(l))).toEqual([]);
  });
});

describe("videoEnv", () => {
  it("reads the .env of the page two folders above the video", () => {
    const { page, cwd, home } = folders({ page: "REPLICATE_API_TOKEN=from-page\n" });
    const video = join(page, "videos", "first video");
    mkdirSync(video, { recursive: true });
    expect(videoEnv(video, { env: { UNFACED_HOME: home }, cwd }).REPLICATE_API_TOKEN).toBe("from-page");
  });
});
