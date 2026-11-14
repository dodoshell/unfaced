import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { alignWords } from "../../engine/src/timing/align.js";

const audio = (name: string) => join(import.meta.dirname, "..", "fixtures", "audio", name);
const clean = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

// Fixtures are spoken by the free voice (voice 1):
//   hello.wav  "Hello world, this is a test."                         2.12 s
//   perche.wav "Perché i gatti fanno le fusa? È più facile di così."  3.76 s
const cases = [
  { file: "hello.wav", language: "en", durationMs: 2122, words: ["hello", "world", "this", "is", "a", "test"] },
  { file: "perche.wav", language: "it", durationMs: 3764, words: ["perché", "i", "gatti", "fanno", "le", "fusa", "è", "più", "facile", "di", "così"] },
];

// Installs whisper.cpp and the models on first use. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("alignWords (slow)", () => {
  it.each(cases)("returns every word of $file in order with increasing times inside the audio", async ({ file, language, durationMs, words: expected }) => {
    const words = await alignWords(audio(file), language);
    expect(words.map((w) => clean(w.text))).toEqual(expected);
    for (let i = 1; i < words.length; i++) {
      expect(words[i]!.startMs).toBeGreaterThan(words[i - 1]!.startMs);
    }
    for (const w of words) expect(w.endMs).toBeGreaterThanOrEqual(w.startMs);
    expect(words.at(-1)!.endMs).toBeLessThanOrEqual(durationMs + 100);
  }, 900_000);
});
