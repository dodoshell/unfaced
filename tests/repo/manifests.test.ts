import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const readJson = (p: string) => JSON.parse(read(p));

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

describe("plugin manifests", () => {
  it("marketplace lists the unfaced plugin from ./plugin", () => {
    const market = readJson(".claude-plugin/marketplace.json");
    expect(market.name).toBe("unfaced");
    expect(market.plugins).toEqual([
      expect.objectContaining({ name: "unfaced", source: "./plugin" }),
    ]);
  });

  it("plugin.json names the plugin, its licence, description and author", () => {
    const plugin = readJson("plugin/.claude-plugin/plugin.json");
    expect(plugin.name).toBe("unfaced");
    expect(plugin.license).toBe("MIT");
    expect(plugin.description).toEqual(expect.any(String));
    expect(plugin.author?.name).toEqual(expect.any(String));
  });

  it("ships no CLAUDE.md inside the plugin folder", () => {
    const names = filesUnder(join(root, "plugin")).map((f) => f.split(/[\\/]/).pop());
    expect(names).not.toContain("CLAUDE.md");
  });
});

describe("agent instruction files", () => {
  it("CLAUDE.md only imports AGENTS.md", () => {
    expect(read("CLAUDE.md").trim()).toBe("@AGENTS.md");
  });

  it("AGENTS.md is under 200 lines and has a routing table", () => {
    const agents = read("AGENTS.md");
    expect(agents.split("\n").length).toBeLessThan(200);
    expect(agents).toMatch(/^\|.+\|\s*\n\|[\s:|-]+\|/m);
  });

  it("has an MIT LICENSE", () => {
    expect(existsSync(join(root, "LICENSE"))).toBe(true);
    expect(read("LICENSE")).toMatch(/MIT License/);
  });
});
