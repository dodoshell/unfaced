import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadMascot } from "../../engine/src/page/mascot.js";

function page(mascot?: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced mascot "));
  if (mascot !== undefined) {
    mkdirSync(join(dir, "brand", "mascot"), { recursive: true });
    writeFileSync(join(dir, "brand", "mascot", "mascot.json"), typeof mascot === "string" ? mascot : JSON.stringify(mascot));
  }
  return dir;
}

describe("loadMascot", () => {
  it("returns nothing for a page without a mascot", () => {
    expect(loadMascot(page())).toBeUndefined();
  });

  it("builds the rig from the species preset and the file's overrides", () => {
    const mascot = loadMascot(page({ name: "Miso", species: "cat", colours: { body: "#FF8800" }, accessories: ["glasses"] }))!;
    expect(mascot.name).toBe("Miso");
    expect(mascot.rig).toMatchObject({ species: "cat", build: "quadruped", ears: "pointy", accessories: ["glasses"] });
    expect(mascot.rig.colours.body).toBe("#FF8800");
    expect(mascot.rig.colours.belly).toBeTruthy();
  });

  it("explains an unknown species", () => {
    expect(() => loadMascot(page({ name: "Rex", species: "dragon" }))).toThrow(/species.*cat, dog/);
  });

  it("explains a bad colour", () => {
    expect(() => loadMascot(page({ name: "Rex", species: "dog", colours: { body: "brown" } }))).toThrow(/colours\.body/);
  });

  it("reads a mascot.json saved with a byte order mark", () => {
    expect(loadMascot(page(`﻿${JSON.stringify({ name: "Miso", species: "cat" })}`))?.name).toBe("Miso");
  });

  it("explains invalid JSON", () => {
    expect(() => loadMascot(page("{ name: "))).toThrow(/mascot\.json is not valid JSON/);
  });
});
