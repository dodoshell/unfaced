// Manual handoff: the agent writes prompts into inbox/PROMPTS.md, the user makes the files
// with any service and drops them into inbox/, and this checks what arrived.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";

export type InboxKind = "image" | "clip" | "voice";

export interface InboxLine {
  file: string;
  /** ok: usable; problem: make won't use it as it is; waiting: a prompt without its file yet; ignored: not read. */
  status: "ok" | "problem" | "waiting" | "ignored";
  detail: string;
}

export interface Probe {
  video?: { codec: string; width: number; height: number };
  audio?: { codec: string };
  durationSec: number | undefined;
}

/** The prompts list the agent writes; not one of the handed-off files. */
export const PROMPTS_FILE = "PROMPTS.md";
/** The credit lines `unfaced generate` keeps for stock photos; not one of the handed-off files either. */
export const CREDITS_FILE = "CREDITS.md";

const KINDS: Record<string, InboxKind> = { ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image", ".mp4": "clip", ".wav": "voice", ".mp3": "voice" };
const SUPPORTED = "use PNG, JPEG or WebP images, MP4 (H.264) clips, WAV or MP3 voice";

export const inboxKind = (file: string): InboxKind | undefined => KINDS[extname(file).toLowerCase()];

/** The files PROMPTS.md asks for: one `## <file name>` heading each, the text under it being the prompt. */
export function parsePrompts(markdown: string): { file: string; prompt: string }[] {
  const prompts: { file: string; prompt: string }[] = [];
  let current: { file: string; lines: string[] } | undefined;
  const flush = () => current && prompts.push({ file: current.file, prompt: current.lines.join("\n").trim() });
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+`?([^`]+?)`?\s*$/.exec(line);
    if (heading) {
      flush();
      current = { file: heading[1]!, lines: [] };
    } else if (/^#\s/.test(line)) {
      flush();
      current = undefined;
    } else current?.lines.push(line);
  }
  flush();
  return prompts;
}

/** Reads the streams, size and duration from ffmpeg's description of an input. */
export function parseProbe(stderr: string): Probe {
  const video = /Stream #\d+:\d+\S*: Video: (\w+)[^\n]*?, (\d{2,5})x(\d{2,5})/.exec(stderr);
  const audio = /Stream #\d+:\d+\S*: Audio: (\w+)/.exec(stderr);
  const duration = /Duration: (\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderr);
  return {
    ...(video ? { video: { codec: video[1]!, width: Number(video[2]), height: Number(video[3]) } } : {}),
    ...(audio ? { audio: { codec: audio[1]! } } : {}),
    durationSec: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : undefined,
  };
}

/** A WebP image's size from its RIFF header (lossy, lossless or extended), or undefined if it isn't one. */
export function webpSize(head: Buffer): { width: number; height: number } | undefined {
  if (head.length < 25 || head.toString("latin1", 0, 4) !== "RIFF" || head.toString("latin1", 8, 12) !== "WEBP") return undefined;
  const chunk = head.toString("latin1", 12, 16);
  if (chunk === "VP8L" && head[20] === 0x2f) {
    const bits = head.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (head.length < 30) return undefined;
  if (chunk === "VP8X") return { width: head.readUIntLE(24, 3) + 1, height: head.readUIntLE(27, 3) + 1 };
  if (chunk === "VP8 " && head[23] === 0x9d && head[24] === 0x01 && head[25] === 0x2a) {
    return { width: head.readUInt16LE(26) & 0x3fff, height: head.readUInt16LE(28) & 0x3fff };
  }
  return undefined;
}

/**
 * Describes a file: a WebP image from its header (the ffmpeg that ships with Remotion can't
 * decode WebP, the renderer's browser can), anything else from ffmpeg reading its start.
 */
export async function probeMedia(path: string): Promise<Probe> {
  if (extname(path).toLowerCase() === ".webp") {
    const size = webpSize(readFileSync(path).subarray(0, 30));
    if (!size) throw new Error(`${path} is not a WebP image`);
    return { video: { codec: "webp", ...size }, durationSec: undefined };
  }
  // Stream copy into the null muxer: the ffmpeg that ships with Remotion has few encoders.
  const { stderr } = await runFfmpeg(["-i", resolve(path), "-map", "0", "-c", "copy", "-t", "0.5", "-f", "null", "-"]);
  return parseProbe(stderr);
}

const portrait = (w: number, h: number) => Math.abs(w / h - 9 / 16) <= 0.01;

function judge(kind: InboxKind, probe: Probe): Pick<InboxLine, "status" | "detail"> {
  const v = probe.video;
  const size = v ? `${v.width}×${v.height}` : "";
  if (kind === "voice") {
    if (!probe.audio) return { status: "problem", detail: "voice: no sound in it" };
    return { status: "ok", detail: `voice, ${probe.durationSec?.toFixed(1) ?? "?"} s` };
  }
  if (!v) return { status: "problem", detail: `can't be read as ${kind === "image" ? "an image" : "a clip"}` };
  if (kind === "image") {
    if (!portrait(v.width, v.height) || v.width < 1080) return { status: "problem", detail: `image ${size}: needs 9:16 (portrait) and at least 1080 wide` };
    return { status: "ok", detail: `image ${size}` };
  }
  const codec = v.codec === "h264" ? "H.264" : v.codec;
  if (v.codec !== "h264" || !portrait(v.width, v.height)) return { status: "problem", detail: `clip ${size} ${codec}: needs H.264 at 9:16 (portrait)` };
  return { status: "ok", detail: `clip ${size} H.264, ${probe.durationSec?.toFixed(1) ?? "?"} s` };
}

/**
 * One line per entry of `<videoDir>/inbox/` (PROMPTS.md and CREDITS.md aside) and one per
 * prompt in PROMPTS.md whose file hasn't arrived yet. No inbox folder means nothing to check.
 */
export async function checkInbox(videoDir: string, probe: (path: string) => Promise<Probe> = probeMedia): Promise<InboxLine[]> {
  const inbox = join(videoDir, "inbox");
  if (!existsSync(inbox)) return [];
  const lines: InboxLine[] = [];
  const names = readdirSync(inbox).filter((n) => n !== PROMPTS_FILE && n !== CREDITS_FILE).sort();
  for (const name of names) {
    const path = join(inbox, name);
    if (statSync(path).isDirectory()) {
      lines.push({ file: `${name}/`, status: "ignored", detail: "folders aren't read; put files directly in inbox/" });
      continue;
    }
    if (name.startsWith(".")) {
      lines.push({ file: name, status: "ignored", detail: "hidden file, not used" });
      continue;
    }
    const kind = inboxKind(name);
    if (!kind) {
      lines.push({ file: name, status: "problem", detail: `unknown type (${extname(name) || "no extension"}), not used: ${SUPPORTED}` });
      continue;
    }
    const probed = await probe(path).catch(() => undefined);
    lines.push({ file: name, ...(probed ? judge(kind, probed) : { status: "problem" as const, detail: `can't be read as ${kind === "voice" ? "audio" : kind === "image" ? "an image" : "a clip"}` }) });
  }
  const promptsFile = join(inbox, PROMPTS_FILE);
  if (existsSync(promptsFile)) {
    for (const { file } of parsePrompts(readFileSync(promptsFile, "utf8"))) {
      if (!names.includes(file)) lines.push({ file, status: "waiting", detail: `no file yet; its prompt is in inbox/${PROMPTS_FILE}` });
    }
  }
  return lines;
}

export const formatInboxLine = (line: InboxLine): string => `${line.status.padEnd(8)} ${line.file} — ${line.detail}`;
