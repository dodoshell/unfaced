import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPage, PageError } from "../../engine/src/page/loadPage.js";
import { stubCatalog } from "./stubCatalog.js";

const fixture = join(import.meta.dirname, "..", "fixtures", "pages", "curious-cats");

function pageDir(yaml: string): string {
  const dir = mkdtempSync(join(tmpdir(), "unfaced page "));
  writeFileSync(join(dir, "page.yaml"), yaml);
  return dir;
}

const minimal = "name: Test\nlanguage: en\nniche: tests\n";

async function errorOf(yaml: string): Promise<PageError> {
  try {
    await loadPage(pageDir(yaml), stubCatalog);
  } catch (e) {
    if (e instanceof PageError) return e;
    throw e;
  }
  throw new Error("expected a PageError");
}

describe("loadPage", () => {
  it("loads the spec's example profile", async () => {
    const page = await loadPage(fixture, stubCatalog);
    expect(page.name).toBe("Curious Cats");
    expect(page.choices.style).toBe(7);
    expect(page.choices.script).toEqual([2, 6, 9]);
    expect(page.choices.hook).toBe("auto");
    expect(page.duration).toEqual({ minSec: 30, maxSec: 45 });
    expect(page.mascot).toBe("Miso, an orange cat with round glasses");
  });

  it("defaults providers to the free ones", async () => {
    const page = await loadPage(pageDir(minimal), stubCatalog);
    expect(page.providers).toEqual({ voice: "free", ai_clips: "none", images: "none" });
  });

  it("rejects a style number outside the catalog and names the valid range", async () => {
    const err = await errorOf(`${minimal}style: 99\n`);
    expect(err.field).toBe("style");
    expect(err.message).toContain("style");
    expect(err.message).toContain("1–12");
  });

  it("rejects a number inside a list that is outside the catalog", async () => {
    const err = await errorOf(`${minimal}script: [2, 40]\n`);
    expect(err.field).toBe("script");
    expect(err.message).toContain("1–10");
  });

  it("names an unknown field and suggests the closest known one", async () => {
    const err = await errorOf(`${minimal}stlye: 3\n`);
    expect(err.field).toBe("stlye");
    expect(err.message).toContain("style");
  });

  it("refuses API keys stored in page.yaml", async () => {
    const err = await errorOf(`${minimal}providers:\n  voice: sk-abc123secret\n`);
    expect(err.message).toBe("API keys must not be stored in page.yaml; use .env");
  });

  it.each([
    ["style: 0", "style", /"style" must be a number from 1–12, a list of different numbers from 1–12, or "auto"/],
    ["style: seven", "style", /"style" must be a number from 1–12.*got "seven"/],
    ["script: [6, 6]", "script", /"script" must be a number from 1–10, a list of different numbers/],
    ["duration: abc", "duration", /"duration" must be a number of seconds \(5 or more\) or a range such as 30-45/],
    ["palette: [red]", "palette", /"palette" must be a list of colours such as "#FF6B35"/],
  ])("explains what %s should be", async (line, field, message) => {
    const err = await errorOf(`${minimal}${line}\n`);
    expect(err.field).toBe(field);
    expect(err.message).toMatch(message);
  });

  it("explains what language should be", async () => {
    const err = await errorOf("name: Test\nlanguage: English\nniche: tests\n");
    expect(err.field).toBe("language");
    expect(err.message).toMatch(/"language" must be a language code such as en or it/);
  });

  it("names an unknown provider field and suggests the closest one", async () => {
    const err = await errorOf(`${minimal}providers:\n  voise: free\n`);
    expect(err.field).toBe("providers.voise");
    expect(err.message).toContain(`Did you mean "voice"?`);
  });

  it("names the voice providers it knows, and reads kokoro as the free one", async () => {
    const err = await errorOf(`${minimal}providers:\n  voice: azure\n`);
    expect(err.field).toBe("providers.voice");
    expect(err.message).toMatch(/free, kokoro, elevenlabs/);
    expect((await loadPage(fixture, stubCatalog)).providers.voice).toBe("free");
  });

  it.each([
    ["pexels", "replicate"],
    ["replicate", "replicate:veo"],
    ["replicate:black-forest-labs/flux-dev", "replicate:kwaivgi/kling-v2.6"],
    ["none", "none"],
  ])("accepts images: %s and ai_clips: %s", async (images, clips) => {
    const page = await loadPage(pageDir(`${minimal}providers:\n  images: ${images}\n  ai_clips: ${clips}\n`), stubCatalog);
    expect(page.providers).toMatchObject({ images, ai_clips: clips });
  });

  it("names the image providers it knows", async () => {
    const err = await errorOf(`${minimal}providers:\n  images: midjourney\n`);
    expect(err.field).toBe("providers.images");
    expect(err.message).toBe(`Unknown image provider "midjourney" in page.yaml; choose one of: none, pexels, replicate, replicate:<owner>/<model>`);
  });

  it("names the clip providers and models it knows", async () => {
    const err = await errorOf(`${minimal}providers:\n  ai_clips: replicate:sora\n`);
    expect(err.field).toBe("providers.ai_clips");
    expect(err.message).toBe(`Unknown clip provider "replicate:sora" in page.yaml; choose one of: none, replicate, replicate:kling, replicate:veo, replicate:seedance, replicate:<owner>/<model>`);
  });

  it.each(["sk_3f9a8b7c6d5e4f3a2b1c", "sk_live_51Hxyz", "xi-abc", "AIzaSyD-123"])("refuses an API key such as %s anywhere in page.yaml", async (key) => {
    const err = await errorOf(`${minimal}mascot: ${key}\n`);
    expect(err.message).toBe("API keys must not be stored in page.yaml; use .env");
  });

  it("says page.yaml is not valid YAML, and where", async () => {
    const err = await errorOf(`${minimal}style: [3\n`);
    expect(err.field).toBe("page.yaml");
    expect(err.message).toMatch(/^page\.yaml is not valid YAML/);
    expect(err.message).toMatch(/line \d+/);
  });

  it("accepts a single number of seconds as duration", async () => {
    const page = await loadPage(pageDir(`${minimal}duration: 30\n`), stubCatalog);
    expect(page.duration).toEqual({ minSec: 30, maxSec: 30 });
  });

  it("explains a missing page.yaml", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced empty "));
    await expect(loadPage(dir, stubCatalog)).rejects.toThrow(/page\.yaml not found/);
  });
});
