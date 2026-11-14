import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { unfacedHome } from "../../engine/src/paths.js";
import { getVoiceProvider, withFreeVoice } from "../../engine/src/voice/registry.js";
import type { VoiceProvider } from "../../engine/src/voice/types.js";

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

  it("uses ElevenLabs when its key is set", () => {
    const warn = vi.fn();
    const provider = getVoiceProvider("elevenlabs", { ELEVENLABS_API_KEY: "test" }, warn);
    expect(provider).toMatchObject({ id: "elevenlabs", isFree: false });
    expect(provider.describeVoice!("en", 1).id).toMatch(/@/);
    expect(warn).not.toHaveBeenCalled();
  });

  it("rejects an unknown provider and lists the known ones", () => {
    expect(() => getVoiceProvider("bogus", {}, () => {})).toThrow(/bogus.*free, elevenlabs/);
  });
});

describe("withFreeVoice", () => {
  const stub = (id: string, synthesize: VoiceProvider["synthesize"]): VoiceProvider => ({ id, isFree: id === "kokoro", available: () => true, synthesize });
  const opts = { language: "en", voiceType: 1, outPath: join("x", "voice.wav") };

  it("records with the free voice, and says why, when the paid call fails", async () => {
    const free = vi.fn<VoiceProvider["synthesize"]>(async (_text, { outPath }) => ({ wavPath: outPath, durationSec: 2, provider: "kokoro" }));
    const paid = stub("elevenlabs", async () => {
      throw new Error("ElevenLabs rate limit (429): Too many concurrent requests.");
    });
    const warn = vi.fn();
    const result = await withFreeVoice(paid, "ElevenLabs", warn, stub("kokoro", free)).synthesize("Hi.", opts);
    expect(result.provider).toBe("kokoro");
    expect(free).toHaveBeenCalledWith("Hi.", opts);
    expect(warn).toHaveBeenCalledWith("ElevenLabs voice failed: ElevenLabs rate limit (429): Too many concurrent requests. Using the free voice instead.");
  });

  it("keeps the paid voice's name and description while it works", async () => {
    const paid = { ...stub("elevenlabs", async (_text, { outPath }) => ({ wavPath: outPath, durationSec: 1, provider: "elevenlabs" })), describeVoice: () => ({ id: "abc@1" }) };
    const voice = withFreeVoice(paid, "ElevenLabs", () => {});
    expect(voice).toMatchObject({ id: "elevenlabs", isFree: false });
    expect(voice.describeVoice!("en", 1)).toEqual({ id: "abc@1" });
    expect((await voice.synthesize("Hi.", opts)).provider).toBe("elevenlabs");
  });
});

describe("unfacedHome", () => {
  it("uses UNFACED_HOME when set, ~/.unfaced otherwise", () => {
    expect(unfacedHome({ UNFACED_HOME: join("x", "my home") })).toBe(join("x", "my home"));
    expect(unfacedHome({})).toMatch(/\.unfaced$/);
  });
});
