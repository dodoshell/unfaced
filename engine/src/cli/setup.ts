import { ensureBrowser } from "@remotion/renderer";
import { ensureModel } from "../download.js";
import { ensureWhisper } from "../timing/align.js";
import { KOKORO_MODEL } from "../voice/kokoro.js";

/** Downloads everything the free pipeline needs, once: voice model, whisper.cpp and models, Remotion's browser. */
export async function setup(log: (m: string) => void = console.error): Promise<void> {
  log("Free voice model");
  await ensureModel(KOKORO_MODEL, log);
  log("Whisper (English and multilingual models)");
  await ensureWhisper("en");
  await ensureWhisper("it");
  log("Remotion browser");
  await ensureBrowser();
}
