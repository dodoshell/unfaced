import { describe, expect, it, vi } from "vitest";
import { runPrediction } from "../../engine/src/generate/replicate.js";

const TOKEN = "r8_test_token";
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const prediction = (status: string, extra: Record<string, unknown> = {}) => ({
  id: "p1",
  status,
  urls: { get: "https://api.replicate.com/v1/predictions/p1", cancel: "https://api.replicate.com/v1/predictions/p1/cancel" },
  ...extra,
});

/** A clock that moves on by each sleep, so polling is tested without waiting. */
function clock() {
  let t = 0;
  return { now: () => t, sleep: vi.fn(async (ms: number) => void (t += ms)) };
}

async function failure(fetchImpl: typeof fetch, timeoutMs = 60_000): Promise<string> {
  const err = await runPrediction("black-forest-labs/flux-2-pro", { prompt: "A cat" }, TOKEN, { fetch: fetchImpl, ...clock(), timeoutMs }).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain(TOKEN);
  return (err as Error).message;
}

describe("runPrediction", () => {
  it("creates a prediction for the model, polls it until it succeeds, and returns its output", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(201, prediction("starting")))
      .mockResolvedValueOnce(json(200, prediction("processing")))
      .mockResolvedValueOnce(json(200, prediction("succeeded", { output: "https://replicate.delivery/a.png" })));
    const time = clock();
    const output = await runPrediction("black-forest-labs/flux-2-pro", { prompt: "A cat", aspect_ratio: "9:16" }, TOKEN, { fetch: fetchImpl, ...time, timeoutMs: 60_000 });

    expect(output).toBe("https://replicate.delivery/a.png");
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe("https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(headers.get("prefer")).toBe("wait=60");
    expect(JSON.parse(String(init?.body))).toEqual({ input: { prompt: "A cat", aspect_ratio: "9:16" } });
    expect(String(fetchImpl.mock.calls[1]![0])).toBe("https://api.replicate.com/v1/predictions/p1");
    expect(time.sleep).toHaveBeenCalledTimes(2);
  });

  it("takes the first file when a model returns a list", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(json(201, prediction("succeeded", { output: ["https://replicate.delivery/a.mp4", "https://replicate.delivery/b.mp4"] })));
    expect(await runPrediction("kwaivgi/kling-v3-video", { prompt: "A cat" }, TOKEN, { fetch: fetchImpl, ...clock(), timeoutMs: 1000 })).toBe("https://replicate.delivery/a.mp4");
  });

  it("gives up after the timeout and cancels the prediction", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => (init?.method === "POST" && String(_url).endsWith("/cancel") ? json(200, prediction("canceled")) : json(200, prediction("processing"))));
    const message = await failure(fetchImpl, 30_000);
    expect(message).toMatch(/Replicate did not finish within 0\.5 minutes/);
    expect(fetchImpl.mock.calls.some(([url, init]) => String(url) === "https://api.replicate.com/v1/predictions/p1/cancel" && init?.method === "POST")).toBe(true);
  });

  it("passes on why a prediction failed", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(json(201, prediction("failed", { error: "NSFW content detected" })));
    expect(await failure(fetchImpl)).toBe("Replicate could not make it: NSFW content detected");
  });

  it.each([
    [401, { title: "Unauthenticated", detail: "You did not pass a valid authentication token" }, /^Replicate refused REPLICATE_API_TOKEN \(401\): check the token in \.env/],
    [402, { title: "Insufficient credit", detail: "You have insufficient credit to run this model." }, /^Replicate needs credit on the account \(402\): You have insufficient credit/],
    [429, { title: "Too Many Requests", detail: "Request was throttled." }, /^Replicate rate limit \(429\): Request was throttled\./],
    [404, { title: "Not found", detail: "The requested resource could not be found." }, /^Replicate has no model "black-forest-labs\/flux-2-pro" \(404\)/],
    [422, { title: "Input validation failed", detail: "- input.aspect_ratio: must be one of 1:1, 16:9" }, /^Replicate did not accept the input for black-forest-labs\/flux-2-pro \(422\): - input\.aspect_ratio/],
    [500, { title: "Internal Server Error" }, /^Replicate answered 500: Internal Server Error/],
  ])("explains a %i answer", async (status, body, message) => {
    expect(await failure(vi.fn<typeof fetch>().mockResolvedValueOnce(json(status, body)))).toMatch(message);
  });

  it("says when Replicate can't be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed", { cause: new Error("connect ECONNREFUSED") });
    });
    expect(await failure(fetchImpl)).toMatch(/^Could not reach Replicate: fetch failed \(connect ECONNREFUSED\)/);
  });
});
