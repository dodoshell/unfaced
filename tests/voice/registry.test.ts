import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { unfacedHome } from "../../engine/src/paths.js";
import { getVoiceProvider } from "../../engine/src/voice/registry.js";

describe("getVoiceProvider", () => {
  it("returns the free local voice for \"free\" without warning", () => {
    const warn = vi.fn();
    const provider = getVoiceProvider("free", {}, warn);
    expect(provider.id).toBe("kokoro");
    expect(provider.isFree).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to the free voice when ElevenLabs has no key, and says which key is missing", () => {
    const warn = vi.fn();
    const provider = getVoiceProvider("elevenlabs", {}, warn);
    expect(provider.isFree).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("ELEVENLABS_API_KEY");
  });

  it("falls back to the free voice when a paid provider is not built yet, even with its key", () => {
    const warn = vi.fn();
    const provider = getVoiceProvider("elevenlabs", { ELEVENLABS_API_KEY: "test" }, warn);
    expect(provider.isFree).toBe(true);
    expect(warn.mock.calls[0]![0]).toMatch(/not available yet/);
  });

  it("rejects an unknown provider and lists the known ones", () => {
    expect(() => getVoiceProvider("bogus", {}, () => {})).toThrow(/bogus.*free, elevenlabs/);
  });
});

describe("unfacedHome", () => {
  it("uses UNFACED_HOME when set, ~/.unfaced otherwise", () => {
    expect(unfacedHome({ UNFACED_HOME: join("x", "my home") })).toBe(join("x", "my home"));
    expect(unfacedHome({})).toMatch(/\.unfaced$/);
  });
});
