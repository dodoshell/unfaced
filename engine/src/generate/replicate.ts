import { reach } from "../http.js";

const API = "https://api.replicate.com/v1";
const POLL_MS = 3000;

export interface PredictionOptions {
  fetch: typeof fetch;
  sleep(ms: number): Promise<void>;
  now(): number;
  /** Cancels the prediction and gives up when it hasn't finished by then. */
  timeoutMs: number;
}

interface Prediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
}

/**
 * Runs an official Replicate model on `input` and returns the URL of the file it made.
 * https://replicate.com/docs/reference/http (models.predictions.create, predictions.get, predictions.cancel)
 */
export async function runPrediction(model: string, input: Record<string, unknown>, token: string, { fetch, sleep, now, timeoutMs }: PredictionOptions): Promise<string> {
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const started = now();
  // Prefer: wait keeps the request open up to 60 s, which is enough for most images.
  let prediction = await call(fetch, `${API}/models/${model}/predictions`, { method: "POST", headers: { ...headers, prefer: "wait=60" }, body: JSON.stringify({ input }) }, model);
  while (prediction.status === "starting" || prediction.status === "processing") {
    if (now() - started >= timeoutMs) {
      await reach("Replicate", fetch, `${API}/predictions/${prediction.id}/cancel`, { method: "POST", headers }).catch(() => undefined);
      throw new Error(`Replicate did not finish within ${timeoutMs / 60_000} minutes, so it was cancelled; run generate again later`);
    }
    await sleep(POLL_MS);
    prediction = await call(fetch, `${API}/predictions/${prediction.id}`, { headers });
  }
  if (prediction.status !== "succeeded") throw new Error(`Replicate could not make it: ${prediction.error ?? prediction.status}`);
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== "string") throw new Error("Replicate finished without a file");
  return output;
}

/** One API call; a refusal becomes a message that says what to do. `model` is set when creating. */
async function call(fetchImpl: typeof fetch, url: string, init: RequestInit, model?: string): Promise<Prediction> {
  const res = await reach("Replicate", fetchImpl, url, init);
  if (res.ok) return (await res.json()) as Prediction;
  const body = (await res.json().catch(() => ({}))) as { title?: string; detail?: string };
  const why = body.detail ?? body.title ?? res.statusText;
  if (res.status === 401) throw new Error(`Replicate refused REPLICATE_API_TOKEN (401): check the token in .env. ${why}`);
  if (res.status === 402) throw new Error(`Replicate needs credit on the account (402): ${why}`);
  if (res.status === 429) throw new Error(`Replicate rate limit (429): ${why}`);
  if (res.status === 404 && model) throw new Error(`Replicate has no model "${model}" (404): check providers in page.yaml`);
  if (res.status === 422 && model) throw new Error(`Replicate did not accept the input for ${model} (422): ${why}`);
  throw new Error(`Replicate answered ${res.status}: ${why}`);
}
