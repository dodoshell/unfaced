import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { encodeWav, parseWav } from "../../engine/src/audio/speech.js";
import { importVoice } from "../../engine/src/voice/prepare.js";

describe("importing a handed-off voice-over", () => {
  it("converts it to a mono WAV at 24 kHz and returns its length", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced import "));
    const samples = new Float32Array(44100).map((_, i) => 0.3 * Math.sin((2 * Math.PI * 220 * i) / 44100));
    writeFileSync(join(dir, "voice in.wav"), encodeWav({ samples, rate: 44100 }));
    const sec = await importVoice(join(dir, "voice in.wav"), join(dir, "voice.wav"));
    expect(sec).toBeCloseTo(1, 2);
    expect(parseWav(readFileSync(join(dir, "voice.wav"))).rate).toBe(24000);
  });

  it("reads the file only as the format its name says", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced import "));
    writeFileSync(join(dir, "voice.mp3"), "#EXTM3U\n#EXTINF:1,\nfile:///etc/hosts\n#EXT-X-ENDLIST\n");
    await expect(importVoice(join(dir, "voice.mp3"), join(dir, "voice.wav"))).rejects.toThrow();
  });
});
