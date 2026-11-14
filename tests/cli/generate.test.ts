import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { type GenerateDeps, generateReport } from "../../engine/src/cli/generate.js";
import { stubCatalog } from "../page/stubCatalog.js";

const TOKEN = "r8_secret_token";
const PROMPTS = "# Prompts\n\n## b2.png\nFor beat b2. A ginger cat kneading a blanket, flat cartoon style, 9:16 portrait.\nSearch: cat kneading blanket\n\n## b3.mp4\nA slow pan over a sleeping cat, 9:16 portrait.\n";

/** A page with the given providers, and one video whose inbox/PROMPTS.md asks for `prompts`. */
function setup(providers: string, prompts = PROMPTS): string {
  const page = mkdtempSync(join(tmpdir(), "unfaced generate "));
  const video = join(page, "videos", "first video");
  mkdirSync(join(video, "inbox"), { recursive: true });
  writeFileSync(join(page, "page.yaml"), `name: Test\nlanguage: en\nniche: tests\nproviders:\n${providers}`);
  writeFileSync(join(video, "inbox", "PROMPTS.md"), prompts);
  return video;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Replicate and Pexels as fakes: every prediction succeeds at once unless `refuse` says otherwise. */
function services(refuse: (model: string) => Response | undefined = () => undefined) {
  const inputs: Record<string, Record<string, unknown>> = {};
  const fetchImpl = vi.fn<typeof fetch>(async (url) => {
    const u = String(url);
    const create = /^https:\/\/api\.replicate\.com\/v1\/models\/(.+)\/predictions$/.exec(u);
    if (create) {
      const model = create[1]!;
      const init = fetchImpl.mock.calls.at(-1)![1]!;
      inputs[model] = (JSON.parse(String(init.body)) as { input: Record<string, unknown> }).input;
      return refuse(model) ?? json(201, { id: "p1", status: "succeeded", output: `https://replicate.delivery/${model}/out`, urls: { get: "x", cancel: "y" } });
    }
    if (u.startsWith("https://replicate.delivery/")) return new Response(`made by ${u.split("/").slice(3, 5).join("/")}`);
    if (u.startsWith("https://api.pexels.com/v1/search")) {
      return json(200, { photos: [{ url: "https://www.pexels.com/photo/cat-1/", photographer: "Jane Doe", src: { original: "https://images.pexels.com/photos/1/cat.jpeg" } }] });
    }
    if (u.startsWith("https://images.pexels.com/")) return new Response("pexels photo");
    throw new Error(`unexpected ${u}`);
  });
  return { fetchImpl, inputs };
}

function deps(env: NodeJS.ProcessEnv, fetchImpl: typeof fetch): GenerateDeps & { fit: ReturnType<typeof vi.fn<GenerateDeps["fit"]>> } {
  return {
    catalog: stubCatalog,
    env,
    fetch: fetchImpl,
    sleep: async () => {},
    now: () => 0,
    fit: vi.fn<GenerateDeps["fit"]>(async (src, dest) => copyFileSync(src, dest)),
    log: () => {},
  };
}

const probe = async () => ({ video: { codec: "h264", width: 1080, height: 1920 }, durationSec: 5 });
const inbox = (video: string, file: string) => readFileSync(join(video, "inbox", file), "utf8");

describe("unfaced generate", () => {
  it("makes each missing file with the page's providers into inbox/, fitted to 9:16, then lists the inbox", async () => {
    const video = setup("  images: replicate\n  ai_clips: replicate\n");
    const { fetchImpl, inputs } = services();
    const d = deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl);
    const { lines, pass } = await generateReport(video, d, probe);

    expect(inbox(video, "b2.png")).toBe("made by black-forest-labs/flux-2-pro");
    expect(inbox(video, "b3.mp4")).toBe("made by kwaivgi/kling-v3-video");
    expect(d.fit).toHaveBeenCalledTimes(2);
    expect(inputs["black-forest-labs/flux-2-pro"]).toEqual({
      prompt: "For beat b2. A ginger cat kneading a blanket, flat cartoon style, 9:16 portrait.",
      aspect_ratio: "9:16",
      resolution: "2 MP",
      output_format: "png",
    });
    expect(inputs["kwaivgi/kling-v3-video"]).toEqual({ prompt: "A slow pan over a sleeping cat, 9:16 portrait.", aspect_ratio: "9:16", duration: 5, generate_audio: false });
    expect(lines).toEqual([
      "made     b2.png — image from Replicate (black-forest-labs/flux-2-pro)",
      "made     b3.mp4 — clip from Replicate (kwaivgi/kling-v3-video)",
      "",
      "ok       b2.png — image 1080×1920",
      "ok       b3.mp4 — clip 1080×1920 H.264, 5.0 s",
    ]);
    expect(pass).toBe(true);
    expect(readdirSync(join(video, "inbox")).sort()).toEqual(["PROMPTS.md", "b2.png", "b3.mp4"]);
  });

  it.each([
    ["replicate:veo", "google/veo-3.1-fast", { duration: 6, generate_audio: false }],
    ["replicate:seedance", "bytedance/seedance-2.0-fast", { duration: 5, generate_audio: false }],
    ["replicate:kwaivgi/kling-v2.6", "kwaivgi/kling-v2.6", {}],
  ])("makes clips with the model %s names", async (choice, model, extra) => {
    const video = setup(`  ai_clips: ${choice}\n`, "## b3.mp4\nA cat.\n");
    const { fetchImpl, inputs } = services();
    await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(inputs[model]).toEqual({ prompt: "A cat.", aspect_ratio: "9:16", ...extra });
    expect(inbox(video, "b3.mp4")).toBe(`made by ${model}`);
  });

  it("leaves every file for manual handoff when the page has no provider, and passes", async () => {
    const video = setup("  images: none\n");
    const { fetchImpl } = services();
    const { lines, pass } = await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(lines).toEqual([
      "skipped  b2.png — no image provider in page.yaml (providers.images: none); make it by hand from its prompt",
      "skipped  b3.mp4 — no clip provider in page.yaml (providers.ai_clips: none); make it by hand from its prompt",
      "",
      "waiting  b2.png — no file yet; its prompt is in inbox/PROMPTS.md",
      "waiting  b3.mp4 — no file yet; its prompt is in inbox/PROMPTS.md",
    ]);
    expect(pass).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("names the missing key and leaves the file for manual handoff", async () => {
    const video = setup("  images: replicate\n  ai_clips: replicate\n", "## b2.png\nA cat.\n");
    const { fetchImpl } = services();
    const { lines, pass } = await generateReport(video, deps({}, fetchImpl), probe);
    expect(lines[0]).toBe("skipped  b2.png — Replicate needs REPLICATE_API_TOKEN in .env; make it by hand from its prompt");
    expect(pass).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("never overwrites a file that is already in inbox/", async () => {
    const video = setup("  images: replicate\n", "## b2.png\nA cat.\n");
    writeFileSync(join(video, "inbox", "b2.png"), "mine");
    const { fetchImpl } = services();
    const { lines } = await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(inbox(video, "b2.png")).toBe("mine");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(lines).toEqual(["ok       b2.png — image 1080×1920"]);
  });

  it("says which file failed and why, carries on with the rest, and fails at the end", async () => {
    const video = setup("  images: replicate\n  ai_clips: replicate\n");
    const { fetchImpl } = services((model) => (model.startsWith("black-forest-labs") ? json(401, { detail: "Invalid token" }) : undefined));
    const { lines, pass } = await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(lines[0]).toMatch(/^failed {3}b2\.png — Replicate refused REPLICATE_API_TOKEN \(401\)/);
    expect(lines[1]).toMatch(/^made {5}b3\.mp4/);
    expect(existsSync(join(video, "inbox", "b2.png"))).toBe(false);
    expect(lines.join("\n")).not.toContain(TOKEN);
    expect(pass).toBe(false);
  });

  it("finds stock photos on Pexels and keeps their credit line in inbox/CREDITS.md", async () => {
    const video = setup("  images: pexels\n", "## b2.jpg\nFor beat b2. A cat, flat style.\nSearch: cat kneading blanket\n\n## b4.jpg\nA dog.\n");
    const { fetchImpl } = services();
    const { lines, pass } = await generateReport(video, deps({ PEXELS_API_KEY: "pexels-key" }, fetchImpl), probe);
    expect(new URL(String(fetchImpl.mock.calls[0]![0])).searchParams.get("query")).toBe("cat kneading blanket");
    expect(inbox(video, "b2.jpg")).toBe("pexels photo");
    expect(lines[0]).toBe("made     b2.jpg — Photo by Jane Doe on Pexels: https://www.pexels.com/photo/cat-1/ (credit kept in inbox/CREDITS.md)");
    expect(inbox(video, "CREDITS.md")).toBe(
      "# Credits\n\n- b2.jpg: Photo by Jane Doe on Pexels: https://www.pexels.com/photo/cat-1/\n- b4.jpg: Photo by Jane Doe on Pexels: https://www.pexels.com/photo/cat-1/\n",
    );
    expect(lines.some((l) => l.includes("CREDITS.md —"))).toBe(false);
    expect(pass).toBe(true);
  });

  it("asks for WebP when the file is .webp, and keeps it as it comes", async () => {
    const video = setup("  images: replicate\n", "## b2.webp\nA cat.\n");
    const { fetchImpl, inputs } = services();
    const d = deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl);
    await generateReport(video, d, probe);
    expect(inputs["black-forest-labs/flux-2-pro"]).toMatchObject({ output_format: "webp" });
    expect(d.fit).not.toHaveBeenCalled();
    expect(inbox(video, "b2.webp")).toBe("made by black-forest-labs/flux-2-pro");
  });

  it("leaves out voice files, other types and names that would land outside inbox/", async () => {
    const video = setup("  images: replicate\n  ai_clips: replicate\n", "## narration.wav\nRead it.\n\n## b2.gif\nA cat.\n\n## ../evil.png\nA cat.\n");
    const { fetchImpl } = services();
    const { lines } = await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(lines.slice(0, 3)).toEqual([
      "skipped  narration.wav — generate makes images and clips, not voice; make it by hand from its prompt",
      "skipped  b2.gif — unknown type; generate makes .png, .jpg, .webp images and .mp4 clips",
      "skipped  ../evil.png — not a plain file name; name it like b2.png",
    ]);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(existsSync(join(video, "evil.png"))).toBe(false);
  });

  it("says when the video has no prompts to make", async () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced generate none "));
    const { lines, pass } = await generateReport(video, deps({}, services().fetchImpl), probe);
    expect(lines[0]).toBe(`No inbox/PROMPTS.md in ${video}: nothing to generate.`);
    expect(pass).toBe(true);
  });
});
