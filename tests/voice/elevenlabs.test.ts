import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { readWavFile } from "../../engine/src/audio/speech.js";
import { ELEVENLABS_VOICES, elevenLabs } from "../../engine/src/voice/elevenlabs.js";

const KEY = "test-key-123";

/** 16-bit little-endian mono samples, as ElevenLabs sends them for a pcm_* output format. */
function pcm(count: number): Uint8Array<ArrayBuffer> {
  const buf = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i++) buf.writeInt16LE(Math.round(Math.sin(i / 10) * 8000), 2 * i);
  return new Uint8Array(buf);
}

const answer = (status: number, body: unknown) =>
  vi.fn<typeof fetch>(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

const outPath = () => join(mkdtempSync(join(tmpdir(), "unfaced elevenlabs ")), "voice.wav");

async function failure(fetchImpl: typeof fetch): Promise<Error> {
  const err = await elevenLabs(KEY, fetchImpl).synthesize("Hello.", { language: "en", voiceType: 1, outPath: outPath() }).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain(KEY);
  return err as Error;
}

describe("ElevenLabs voice", () => {
  it("has its own premade voice for each spoken voice type, and none for text only", () => {
    const voice = elevenLabs(KEY);
    const ids = [1, 2, 3, 4, 5, 6, 7].map((type) => voice.describeVoice!("en", type).id);
    expect(new Set(ids).size).toBe(7);
    expect(voice.describeVoice!("it", 1)).toEqual({ id: `${ELEVENLABS_VOICES[1]!.id}@${ELEVENLABS_VOICES[1]!.speed}` });
    expect(() => voice.describeVoice!("en", 8)).toThrow(/voice 8/i);
  });

  it("is documented, voice by voice, in the voice catalog", () => {
    const catalog = readFileSync(join(import.meta.dirname, "..", "..", "catalog", "voices.md"), "utf8");
    for (const { name, id, speed } of Object.values(ELEVENLABS_VOICES)) expect(catalog).toContain(`ElevenLabs: ${name} (\`${id}\`) at ${speed.toFixed(2).replace(/0$/, "")}×`);
  });

  it("asks the multilingual model for 24 kHz PCM and writes it as a WAV, returning its length", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(pcm(36000), { status: 200, headers: { "content-type": "audio/pcm" } }));
    const out = outPath();
    const result = await elevenLabs(KEY, fetchImpl).synthesize("Cats purr.", { language: "it", voiceType: 2, outPath: out });

    expect(result).toEqual({ wavPath: out, durationSec: 1.5, provider: "elevenlabs" });
    const wav = readWavFile(out);
    expect(wav.rate).toBe(24000);
    expect(wav.samples.length).toBe(36000);

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICES[2]!.id}?output_format=pcm_24000`);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("xi-api-key")).toBe(KEY);
    expect(JSON.parse(String(init?.body))).toEqual({ text: "Cats purr.", model_id: "eleven_multilingual_v2", voice_settings: { speed: ELEVENLABS_VOICES[2]!.speed } });
  });

  it("names the variable when the key is refused", async () => {
    const err = await failure(answer(401, { detail: { status: "invalid_api_key", message: "Invalid API key" } }));
    expect(err.message).toMatch(/ElevenLabs refused ELEVENLABS_API_KEY.*\.env/);
  });

  it("says when the account's quota is used up", async () => {
    const err = await failure(answer(401, { detail: { status: "quota_exceeded", message: "This request exceeds your quota of 10000." } }));
    expect(err.message).toMatch(/quota/);
    expect(err.message).toContain("This request exceeds your quota of 10000.");
  });

  it("names the limit when there are too many requests", async () => {
    const err = await failure(answer(429, { detail: { status: "too_many_concurrent_requests", message: "Too many concurrent requests." } }));
    expect(err.message).toMatch(/ElevenLabs rate limit \(429\)/);
  });

  it("passes on what ElevenLabs says about any other refusal", async () => {
    const err = await failure(answer(422, { detail: [{ loc: ["body", "text"], msg: "Text is too long", type: "value_error" }] }));
    expect(err.message).toBe("ElevenLabs answered 422: Text is too long");
  });

  it("says when ElevenLabs can't be reached", async () => {
    const err = await failure(vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed", { cause: new Error("getaddrinfo ENOTFOUND api.elevenlabs.io") });
    }));
    expect(err.message).toMatch(/Could not reach ElevenLabs.*ENOTFOUND/);
  });
});
