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

/** A file of `type` (its first bytes), followed by `text`. */
const SIGNATURES: Record<string, string> = { png: "\x89PNG\r\n\x1a\n", jpg: "\xff\xd8\xff\xe0", webp: "RIFF\x10\0\0\0WEBPVP8 ", mp4: "\0\0\0\x18ftypisom" };
const file = (type: string, text: string) => new Response(new Uint8Array(Buffer.from(SIGNATURES[type] + text, "latin1")));

/**
 * Replicate and Pexels as fakes: every prediction succeeds at once and its file is what it
 * should be, unless `refuse` answers the prediction or `deliver` the download instead.
 */
function services(refuse: (model: string) => Response | undefined = () => undefined, deliver: (url: string) => Response | undefined = () => undefined) {
  const inputs: Record<string, Record<string, unknown>> = {};
  const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
    const u = String(url);
    const create = /^https:\/\/api\.replicate\.com\/v1\/models\/(.+)\/predictions$/.exec(u);
    if (create) {
      const model = create[1]!;
      inputs[model] = (JSON.parse(String(init?.body)) as { input: Record<string, unknown> }).input;
      const type = String(inputs[model]!.output_format ?? "mp4");
      return refuse(model) ?? json(201, { id: "p1", status: "succeeded", output: `https://replicate.delivery/${model}/out.${type}`, urls: { get: "x", cancel: "y" } });
    }
    if (u.startsWith("https://replicate.delivery/")) return deliver(u) ?? file(u.split(".").at(-1)!, `made by ${u.split("/").slice(3, 5).join("/")}`);
    if (u.startsWith("https://api.pexels.com/v1/search")) {
      return json(200, { photos: [{ url: "https://www.pexels.com/photo/cat-1/", photographer: "Jane Doe", src: { original: "https://images.pexels.com/photos/1/cat.jpeg" } }] });
    }
    if (u.startsWith("https://images.pexels.com/")) return deliver(u) ?? file("jpg", "pexels photo");
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
/** A file in the video's inbox/, its first bytes (the signature) left out. */
const inbox = (video: string, name: string) => readFileSync(join(video, "inbox", name), "latin1").replace(/^(\x89PNG\r\n\x1a\n|\xff\xd8\xff\xe0|RIFF\x10\0\0\0WEBPVP8 |\0\0\0\x18ftypisom)/, "");

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

  it("refuses a download that isn't what its name says, such as a playlist disguised as .png, before ffmpeg sees it", async () => {
    const video = setup("  images: replicate\n", "## b2.png\nA cat.\n");
    const { fetchImpl } = services(undefined, () => new Response("#EXTM3U\n#EXTINF:1,\nfile:///etc/passwd\n#EXT-X-ENDLIST\n"));
    const d = deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl);
    const { lines, pass } = await generateReport(video, d, probe);
    expect(lines[0]).toBe("failed   b2.png — Replicate sent something that isn't a PNG or JPEG image for b2.png; nothing was written");
    expect(d.fit).not.toHaveBeenCalled();
    expect(existsSync(join(video, "inbox", "b2.png"))).toBe(false);
    expect(pass).toBe(false);
  });

  it("downloads only from the provider's own hosts", async () => {
    const video = setup("  images: replicate\n", "## b2.png\nA cat.\n");
    const { fetchImpl } = services(() => json(201, { id: "p1", status: "succeeded", output: "https://169.254.169.254/latest/meta-data", urls: { get: "x", cancel: "y" } }));
    const { lines } = await generateReport(video, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), probe);
    expect(lines[0]).toMatch(/^failed {3}b2\.png — Refused to download from 169\.254\.169\.254: Replicate files come only from replicate\.delivery/);
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes("169.254"))).toBe(false);
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

/** A page with one post whose slides.md has `front` as its front matter, and whose inbox/PROMPTS.md asks for `prompts`. */
function setupPost(front: string, prompts: string, pageExtra = ""): string {
  const page = mkdtempSync(join(tmpdir(), "unfaced generate "));
  const post = join(page, "posts", "first post");
  mkdirSync(join(post, "inbox"), { recursive: true });
  writeFileSync(join(page, "page.yaml"), `name: Test\nlanguage: en\nniche: tests\nproviders:\n  images: replicate\n  ai_clips: replicate\n${pageExtra}`);
  writeFileSync(join(post, "slides.md"), `---\ntitle: T\npost_type: 1\n${front}---\n\n## cover\n# Hello\n`);
  writeFileSync(join(post, "inbox", "PROMPTS.md"), prompts);
  return post;
}

describe("unfaced generate for a post", () => {
  const postProbe = async () => ({ video: { codec: "png", width: 1080, height: 1350 }, durationSec: undefined });

  it("asks for 4:5 and fits to 1080×1350 for an instagram-carousel", async () => {
    const post = setupPost("format: instagram-carousel\n", "## shop.png\nFor slide 2. A shop front.\n");
    const { fetchImpl, inputs } = services();
    const d = deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl);
    const { lines, pass } = await generateReport(post, d, postProbe);
    expect(inputs["black-forest-labs/flux-2-pro"]!.aspect_ratio).toBe("4:5");
    expect(d.fit).toHaveBeenCalledWith(expect.any(String), expect.any(String), { width: 1080, height: 1350 });
    expect(lines).toContain("ok       shop.png — image 1080×1350");
    expect(pass).toBe(true);
  });

  it("asks for 9:16 for a story, from the page's formats when slides.md names none", async () => {
    const post = setupPost("", "## shop.png\nA shop front.\n", "formats: [story]\n");
    const { fetchImpl, inputs } = services();
    const d = deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl);
    await generateReport(post, d, postProbe);
    expect(inputs["black-forest-labs/flux-2-pro"]!.aspect_ratio).toBe("9:16");
    expect(d.fit).toHaveBeenCalledWith(expect.any(String), expect.any(String), { width: 1080, height: 1920 });
  });

  it("asks for 1:1 for a square instagram-post, and Pexels crops to the size", async () => {
    const post = setupPost("format: instagram-post\nsquare: true\n", "## shop.jpg\nA shop.\nSearch: shop\n");
    writeFileSync(join(post, "..", "..", "page.yaml"), "name: Test\nlanguage: en\nniche: tests\nproviders:\n  images: pexels\n");
    const { fetchImpl } = services();
    const d = deps({ PEXELS_API_KEY: "k" }, fetchImpl);
    await generateReport(post, d, postProbe);
    expect(d.fit).toHaveBeenCalledWith(expect.any(String), expect.any(String), { width: 1080, height: 1080 });
    const urls = fetchImpl.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.startsWith("https://api.pexels.com/v1/search") && u.includes("orientation=square"))).toBe(true);
    expect(urls.some((u) => u.includes("w=1080&h=1080"))).toBe(true);
  });

  it("does not make clips or voice for a post, and says why", async () => {
    const post = setupPost("format: instagram-carousel\n", "## b3.mp4\nA pan.\n\n## v.wav\nA voice.\n");
    const { fetchImpl } = services();
    const { lines } = await generateReport(post, deps({ REPLICATE_API_TOKEN: TOKEN }, fetchImpl), postProbe);
    expect(lines[0]).toMatch(/^skipped {2}b3\.mp4 — posts use images only/);
    expect(lines[1]).toMatch(/^skipped {2}v\.wav — posts use images only/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
