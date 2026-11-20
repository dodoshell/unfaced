// `unfaced generate`: makes the files inbox/PROMPTS.md asks for with the page's image and clip
// providers. Without a provider or its key a file is left for manual handoff, as before.
import { appendFileSync, constants, copyFileSync, existsSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { CREDITS_FILE, inboxKind } from "../inbox/inbox.js";
import { aspectOf, postFormatOf } from "../post/postFormat.js";
import type { CatalogLike, Page } from "../page/types.js";
import type { Size } from "./fit.js";
import { downloadFile, type FileType, sniffFile } from "./download.js";
import { findPhoto, PEXELS_FILE_HOSTS, stockQuery, withoutSearchLine } from "./pexels.js";
import { clipProvider, imageProvider, MODEL_INPUTS, type MediaProvider } from "./providers.js";
import { REPLICATE_FILE_HOSTS, runPrediction } from "./replicate.js";

export interface GenerateDeps {
  catalog: CatalogLike;
  /** The environment with the .env files loaded: where the keys come from. */
  env: NodeJS.ProcessEnv;
  fetch: typeof fetch;
  sleep(ms: number): Promise<void>;
  now(): number;
  /** Fills and crops a downloaded file to `size`, written in the format `dest`'s extension names. */
  fit(src: string, dest: string, size: Size): Promise<void>;
  log(msg: string): void;
}

export interface GenerateLine {
  file: string;
  /** made: now in inbox/; skipped: left for manual handoff; failed: the provider could not make it. */
  status: "made" | "skipped" | "failed";
  detail: string;
}

const KEYS = {
  replicate: { service: "Replicate", envKey: "REPLICATE_API_TOKEN" },
  pexels: { service: "Pexels", envKey: "PEXELS_API_KEY" },
} as const;

/** How long a prediction may take before it is cancelled. */
const TIMEOUT_MS = { image: 5 * 60_000, clip: 15 * 60_000 };
/** The largest file downloaded. */
const MAX_BYTES = { image: 50 * 1024 ** 2, clip: 300 * 1024 ** 2 };

/**
 * What a downloaded file may be, by the extension asked for. A PNG or JPEG is converted to the
 * other (Pexels serves JPEG); WebP is kept as it comes, since the engine's ffmpeg can't write it.
 */
const ACCEPTS: Record<string, { types: FileType[]; label: string }> = {
  ".png": { types: ["png", "jpeg"], label: "a PNG or JPEG image" },
  ".jpg": { types: ["png", "jpeg"], label: "a PNG or JPEG image" },
  ".jpeg": { types: ["png", "jpeg"], label: "a PNG or JPEG image" },
  ".webp": { types: ["webp"], label: "a WebP image" },
  ".mp4": { types: ["mp4"], label: "an MP4 clip" },
};
const TYPE_EXT: Record<FileType, string> = { png: ".png", jpeg: ".jpg", webp: ".webp", mp4: ".mp4" };

const VIDEO_SIZE: Size = { width: 1080, height: 1920 };
const BY_HAND = "make it by hand from its prompt";

/**
 * Makes every file in `prompts` that `<videoDir>/inbox/` doesn't have yet, one line each.
 * A file already there is never touched; one provider failing doesn't stop the others.
 */
export async function generateMissing(videoDir: string, prompts: { file: string; prompt: string }[], page: Page, deps: GenerateDeps): Promise<GenerateLine[]> {
  const inbox = join(videoDir, "inbox");
  const lines: GenerateLine[] = [];
  const post = postFormatOf(videoDir, page.formats);
  const size: Size = post ? { width: post.width, height: post.height } : VIDEO_SIZE;
  const skip = (file: string, detail: string) => lines.push({ file, status: "skipped", detail });
  for (const { file, prompt } of prompts) {
    if (/[\\/]/.test(file) || file.startsWith(".")) {
      skip(file, "not a plain file name; name it like b2.png");
      continue;
    }
    if (existsSync(join(inbox, file))) continue;
    const kind = inboxKind(file);
    if (!kind) {
      skip(file, "unknown type; generate makes .png, .jpg, .webp images and .mp4 clips");
      continue;
    }
    if (post && kind !== "image") {
      skip(file, "posts use images only, so this file is not made");
      continue;
    }
    if (kind === "voice") {
      skip(file, `generate makes images and clips, not voice; ${BY_HAND}`);
      continue;
    }
    const field = kind === "image" ? "images" : "ai_clips";
    const provider = kind === "image" ? imageProvider(page.providers.images) : clipProvider(page.providers.ai_clips);
    if (!provider || provider.name === "none") {
      skip(file, `no ${kind} provider in page.yaml (providers.${field}: ${page.providers[field]}); ${BY_HAND}`);
      continue;
    }
    const { service, envKey } = KEYS[provider.name];
    const key = deps.env[envKey];
    if (!key) {
      skip(file, `${service} needs ${envKey} in .env; ${BY_HAND}`);
      continue;
    }
    try {
      lines.push({ file, status: "made", detail: await makeFile(inbox, file, kind, prompt, provider, key, size, deps) });
    } catch (e) {
      lines.push({ file, status: "failed", detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return lines;
}

/** Makes one file into a temporary folder, fits it to `size` and copies it into inbox/; returns what made it. */
async function makeFile(inbox: string, file: string, kind: "image" | "clip", prompt: string, provider: Exclude<MediaProvider, { name: "none" }>, key: string, size: Size, deps: GenerateDeps): Promise<string> {
  const ext = extname(file).toLowerCase();
  const tmp = mkdtempSync(join(tmpdir(), "unfaced generate "));
  try {
    const downloaded = join(tmp, "download");
    const limit = { maxBytes: MAX_BYTES[kind], what: kind === "image" ? "an image" : "a clip", fetch: deps.fetch };
    const { service } = KEYS[provider.name];
    let detail: string;
    let credit: string | undefined;
    if (provider.name === "pexels") {
      deps.log(`Finding a photo for ${file} on Pexels`);
      const photo = await findPhoto(stockQuery(prompt), key, deps.fetch, ext === ".webp", size);
      await downloadFile(photo.url, downloaded, { service, hosts: PEXELS_FILE_HOSTS, ...limit });
      credit = photo.credit;
      detail = `${photo.credit} (credit kept in inbox/${CREDITS_FILE})`;
    } else {
      deps.log(`Making ${file} with Replicate (${provider.model})${kind === "clip" ? "; a clip can take a few minutes" : ""}`);
      const format = kind === "image" ? { output_format: ext === ".webp" ? "webp" : ext === ".png" ? "png" : "jpg" } : {};
      const input = { prompt: withoutSearchLine(prompt), aspect_ratio: aspectOf(size), ...format, ...MODEL_INPUTS[provider.model] };
      const url = await runPrediction(provider.model, input, key, { fetch: deps.fetch, sleep: deps.sleep, now: deps.now, timeoutMs: TIMEOUT_MS[kind] });
      await downloadFile(url, downloaded, { service, hosts: REPLICATE_FILE_HOSTS, ...limit });
      detail = `${kind} from Replicate (${provider.model})`;
    }
    // Checked by its first bytes before ffmpeg reads it, and named for what it is, since ffmpeg
    // decodes a picture by its extension.
    const accepts = ACCEPTS[ext]!;
    const type = sniffFile(downloaded);
    if (!type || !accepts.types.includes(type)) throw new Error(`${service} sent something that isn't ${accepts.label} for ${file}; nothing was written`);
    const raw = join(tmp, `download${TYPE_EXT[type]}`);
    renameSync(downloaded, raw);
    // WebP is kept as it comes (asked for at the right aspect): the engine's ffmpeg can't write it.
    const ready = ext === ".webp" ? raw : join(tmp, `fitted${ext}`);
    if (ready !== raw) await deps.fit(raw, ready, size);
    try {
      copyFileSync(ready, join(inbox, file), constants.COPYFILE_EXCL);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`${file} arrived in inbox/ meanwhile; kept that one`);
      throw e;
    }
    if (credit) keepCredit(inbox, file, credit);
    return detail;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Adds a stock photo's credit line to inbox/CREDITS.md, for the post's caption. */
function keepCredit(inbox: string, file: string, credit: string): void {
  const path = join(inbox, CREDITS_FILE);
  if (!existsSync(path)) writeFileSync(path, "# Credits\n\n");
  appendFileSync(path, `- ${file}: ${credit}\n`);
}
