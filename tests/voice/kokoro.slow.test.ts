import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kokoro } from "../../engine/src/voice/kokoro.js";

// Synthesizes real audio (downloads the model once, ~127 MB). Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("kokoro (slow)", () => {
  const out = mkdtempSync(join(tmpdir(), "unfaced voice è "));

  it.each([
    ["en", "Why do cats purr?"],
    ["it", "Perché i gatti fanno le fusa?"],
  ])("synthesizes %s to a WAV of a plausible length", async (language, text) => {
    const outPath = join(out, `${language}.wav`);
    const result = await kokoro.synthesize(text, { language, voiceType: 1, outPath });
    expect(result.wavPath).toBe(outPath);
    expect(result.provider).toBe("kokoro");
    expect(result.durationSec).toBeGreaterThan(1);
    expect(result.durationSec).toBeLessThan(6);
  }, 600_000);

  it("refuses a language the free voice does not cover", async () => {
    await expect(kokoro.synthesize("Hallo", { language: "de", voiceType: 1, outPath: join(out, "de.wav") })).rejects.toThrow(/de.*en, it/);
  });
});
