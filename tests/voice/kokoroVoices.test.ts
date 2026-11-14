import { describe, expect, it } from "vitest";
import { KOKORO_LANGUAGES, KOKORO_SPEAKERS, kokoroVoice } from "../../engine/src/voice/kokoro.js";

describe("kokoro voices", () => {
  it("maps voice types 1-7 to a real speaker in every language", () => {
    for (const language of KOKORO_LANGUAGES) {
      for (let type = 1; type <= 7; type++) {
        const voice = kokoroVoice(language, type);
        expect(KOKORO_SPEAKERS, `${language} ${type}`).toContain(voice.speaker);
        expect(voice.speed).toBeGreaterThan(0.7);
        expect(voice.speed).toBeLessThan(1.3);
      }
    }
  });

  it("gives English a different speaker or speed for every voice type", () => {
    const voices = [1, 2, 3, 4, 5, 6, 7].map((t) => JSON.stringify(kokoroVoice("en", t)));
    expect(new Set(voices).size).toBe(7);
  });

  it("says when a voice type is an approximation in a language with few speakers", () => {
    expect(kokoroVoice("en", 4).note).toBeUndefined();
    expect(kokoroVoice("it", 4).note).toMatch(/Italian/);
  });

  it("reads a regional code as its language", () => {
    expect(kokoroVoice("it-IT", 1)).toEqual(kokoroVoice("it", 1));
  });

  it("refuses an unknown language or voice type", () => {
    expect(() => kokoroVoice("de", 1)).toThrow(/de.*en, it/);
    expect(() => kokoroVoice("en", 8)).toThrow(/Voice 8/);
  });
});
