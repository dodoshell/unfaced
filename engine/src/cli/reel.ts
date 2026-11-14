import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HOOK_REEL_ID } from "../../remotion/compositionId.js";
import { stylesWithLayout } from "../../remotion/styles/layouts.js";
import { encodeWav, type Pcm, parseWav } from "../audio/speech.js";
import { Catalog } from "../catalog/catalog.js";
import { CATALOG_DIR, LIBRARY_ROOT } from "../paths.js";
import { closeRenders, type RenderJob, renderMediaOf } from "../render/renderVideo.js";
import { kokoro } from "../voice/kokoro.js";
import { prepareVoice } from "../voice/prepare.js";

export interface HookExample {
  num: number;
  name: string;
  niche: string;
  text: string;
}

export interface ReelSegment {
  text: string;
  label: string;
  style: number;
  fromFrame: number;
  durationInFrames: number;
}

/** The first example line of every ready hook in catalog/hooks.md, in catalog order. */
export function hookExamples(markdown: string): HookExample[] {
  const hooks: HookExample[] = [];
  for (const section of markdown.split(/^## /m).slice(1)) {
    const head = /^(\d+)\s+(.+)$/m.exec(section);
    const ready = /\*\*Status:\*\*\s*ready/.test(section);
    const example = /^\s+- ([^:\n]+):\s*"([^"]+)"/m.exec(section.slice(section.indexOf("Examples:")));
    if (head && ready && example) hooks.push({ num: Number(head[1]), name: head[2]!.trim(), niche: example[1]!.trim(), text: example[2]!.trim() });
  }
  return hooks;
}

/** At least this long on screen, so a short line can still be read. */
const MIN_SEC = 2.5;
/** Time after the speech before the next line. */
const BREATH_SEC = 0.6;

/** One segment per line, back to back, each in the next style in turn. */
export function reelSegments(hooks: HookExample[], spokenSec: number[], styles: number[], fps: number): ReelSegment[] {
  let from = 0;
  return hooks.map((hook, i) => {
    const durationInFrames = Math.round(Math.max(MIN_SEC, spokenSec[i]! + BREATH_SEC) * fps);
    const segment = { text: hook.text, label: `Hook ${String(hook.num).padStart(2, "0")} · ${hook.name}`, style: styles[i % styles.length]!, fromFrame: from, durationInFrames };
    from += durationInFrames;
    return segment;
  });
}

export interface ReelDeps {
  catalog: Catalog;
  /** Speaks one line and returns it as prepared mono audio. */
  speak(text: string): Promise<Pcm>;
  renderMedia(job: RenderJob): Promise<void>;
  log(msg: string): void;
}

const FPS = 30;
/** The energetic voice: a reel of openers wants pace. */
const REEL_VOICE = 2;

async function speakFree(text: string, dir: string): Promise<Pcm> {
  const file = join(dir, `line-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
  await kokoro.synthesize(text, { language: "en", voiceType: REEL_VOICE, outPath: file });
  await prepareVoice(file);
  return parseWav(readFileSync(file));
}

/**
 * `unfaced reel hooks`: every hook's first example, spoken, each over the title scene of the
 * next style in turn, in one video (default examples/hooks/hook-reel.mp4).
 */
export async function renderHookReel(options: { out?: string } = {}, deps?: ReelDeps): Promise<string> {
  const work = mkdtempSync(join(tmpdir(), "unfaced-reel-"));
  const d: ReelDeps = deps ?? { catalog: Catalog.load(CATALOG_DIR), speak: (text) => speakFree(text, work), renderMedia: renderMediaOf, log: (m) => console.error(m) };
  const out = options.out ?? join(LIBRARY_ROOT, "examples", "hooks", "hook-reel.mp4");
  try {
    const hooks = hookExamples(readFileSync(join(CATALOG_DIR, "hooks.md"), "utf8"));
    const lines: Pcm[] = [];
    for (const hook of hooks) {
      d.log(`Recording hook ${hook.num}: ${hook.text}`);
      lines.push(await d.speak(hook.text));
    }
    const rate = lines[0]?.rate ?? 24000;
    const segments = reelSegments(hooks, lines.map((l) => l.samples.length / l.rate), stylesWithLayout(), FPS);
    const end = segments.at(-1);
    const total = new Float32Array(Math.ceil((((end?.fromFrame ?? 0) + (end?.durationInFrames ?? 0)) / FPS) * rate));
    segments.forEach((s, i) => total.set(lines[i]!.samples.subarray(0, total.length - Math.round((s.fromFrame / FPS) * rate)), Math.round((s.fromFrame / FPS) * rate)));
    writeFileSync(join(work, "voice.wav"), encodeWav({ samples: total, rate }));
    await d.renderMedia({ id: HOOK_REEL_ID, inputProps: { segments, audioSrc: "voice.wav" }, outPath: out, assetsDir: work, files: ["voice.wav"] });
    d.log(`Hook reel: ${out}`);
    return out;
  } finally {
    if (!deps) await closeRenders();
    rmSync(work, { recursive: true, force: true });
  }
}
