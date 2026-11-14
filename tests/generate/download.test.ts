import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { downloadFile, sniffFile } from "../../engine/src/generate/download.js";

const HOSTS = ["replicate.delivery", "*.replicate.delivery"];
const MB = 1024 ** 2;
const options = (fetchImpl: typeof fetch, maxBytes = MB) => ({ service: "Replicate", hosts: HOSTS, maxBytes, what: "an image", fetch: fetchImpl });
const dest = () => join(mkdtempSync(join(tmpdir(), "unfaced download ")), "download");

async function refusal(url: string, fetchImpl: typeof fetch, maxBytes?: number): Promise<{ message: string; file: string }> {
  const file = dest();
  const err = await downloadFile(url, file, options(fetchImpl, maxBytes)).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(Error);
  expect(existsSync(file), "nothing written").toBe(false);
  return { message: (err as Error).message, file };
}

describe("downloadFile", () => {
  it("downloads over https from the provider's host and its subdomains, without following redirects blindly", async () => {
    for (const url of ["https://replicate.delivery/a/out.png", "https://pbxt.replicate.delivery/a/out.png"]) {
      const fetchImpl = vi.fn<typeof fetch>(async () => new Response("picture"));
      const file = dest();
      await downloadFile(url, file, options(fetchImpl));
      expect(readFileSync(file, "utf8")).toBe("picture");
      expect(fetchImpl.mock.calls[0]![1]).toMatchObject({ redirect: "manual" });
    }
  });

  it.each(["https://evil.example/a.png", "https://replicate.delivery.evil.example/a.png", "https://evilreplicate.delivery/a.png", "https://replicate.delivery@evil.example/a.png"])(
    "refuses %s, naming its host, without asking for it",
    async (url) => {
      const fetchImpl = vi.fn<typeof fetch>();
      const { message } = await refusal(url, fetchImpl);
      expect(message).toBe(`Refused to download from ${new URL(url).hostname}: Replicate files come only from replicate.delivery, *.replicate.delivery; nothing was written`);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it("refuses plain http, even on the provider's host", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const { message } = await refusal("http://replicate.delivery/a.png", fetchImpl);
    expect(message).toBe("Refused to download from replicate.delivery over http: Replicate files must come over https; nothing was written");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a redirect off the provider's hosts, and follows one that stays on them", async () => {
    const away = vi.fn<typeof fetch>(async () => new Response(null, { status: 302, headers: { location: "https://evil.example/x" } }));
    const { message } = await refusal("https://replicate.delivery/a.png", away);
    expect(message).toMatch(/^Refused to download from evil\.example \(a redirect from replicate\.delivery\): /);
    expect(away).toHaveBeenCalledOnce();

    const within = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://pbxt.replicate.delivery/b.png" } }))
      .mockResolvedValueOnce(new Response("picture"));
    const file = dest();
    await downloadFile("https://replicate.delivery/a.png", file, options(within));
    expect(readFileSync(file, "utf8")).toBe("picture");
    expect(String(within.mock.calls[1]![0])).toBe("https://pbxt.replicate.delivery/b.png");
  });

  it("stops reading past the size limit and deletes what it wrote", async () => {
    const endless = new ReadableStream<Uint8Array>({ pull: (c) => c.enqueue(new Uint8Array(64 * 1024)) });
    const { message } = await refusal("https://replicate.delivery/a.png", vi.fn<typeof fetch>(async () => new Response(endless)), 2 * MB);
    expect(message).toBe("The file from Replicate is over the 2 MB limit for an image; nothing was written");
  });

  it("refuses a file that says it is over the limit before reading it", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("small", { headers: { "content-length": String(3 * MB) } }));
    expect((await refusal("https://replicate.delivery/a.png", fetchImpl, 2 * MB)).message).toMatch(/over the 2 MB limit/);
  });

  it("says when the host answers with an error", async () => {
    expect((await refusal("https://replicate.delivery/a.png", vi.fn<typeof fetch>(async () => new Response("no", { status: 403 })))).message).toBe(
      "Could not download the file from Replicate: HTTP 403",
    );
  });
});

describe("sniffFile", () => {
  const file = (bytes: string) => {
    const path = dest();
    writeFileSync(path, Buffer.from(bytes, "latin1"));
    return path;
  };

  it("knows PNG, JPEG, WebP and MP4 by their first bytes", () => {
    expect(sniffFile(file("\x89PNG\r\n\x1a\n rest"))).toBe("png");
    expect(sniffFile(file("\xff\xd8\xff\xe0 rest"))).toBe("jpeg");
    expect(sniffFile(file("RIFF\x10\0\0\0WEBPVP8 rest"))).toBe("webp");
    expect(sniffFile(file("\0\0\0\x18ftypisom rest"))).toBe("mp4");
  });

  it("knows nothing else, such as a playlist or a concat list", () => {
    expect(sniffFile(file("#EXTM3U\n#EXTINF:1,\nfile:///etc/passwd\n"))).toBeUndefined();
    expect(sniffFile(file("ffconcat version 1.0\nfile 'secret.png'\n"))).toBeUndefined();
    expect(sniffFile(file(""))).toBeUndefined();
  });
});
