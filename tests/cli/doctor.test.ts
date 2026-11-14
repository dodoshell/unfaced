import { describe, expect, it } from "vitest";
import { type Check, defaultChecks, runDoctor } from "../../engine/src/cli/doctor.js";

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
    expect(defaultChecks({}).map((c) => c.name)).toEqual(["Node 22 or newer", "Free voice model", "Whisper", "Remotion browser", "tar", "2 GB free disk space"]);
  });
});
