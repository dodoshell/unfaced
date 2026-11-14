// Files a provider made are downloaded from the address its API returns. That address is only
// trusted on the provider's own hosts, over https, up to a size limit; what arrives is then
// checked by its first bytes before ffmpeg ever reads it.
import { closeSync, createWriteStream, openSync, readSync, rmSync, writeFileSync } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { reach } from "../http.js";

export interface DownloadOptions {
  /** Who made the file, for messages: "Replicate". */
  service: string;
  /** The hosts its files may come from; "*.example.com" means any subdomain of example.com. */
  hosts: readonly string[];
  maxBytes: number;
  /** What the limit is for, for messages: "an image". */
  what: string;
  fetch: typeof fetch;
}

const MAX_REDIRECTS = 3;

const allowed = (host: string, hosts: readonly string[]) => hosts.some((h) => (h.startsWith("*.") ? host.endsWith(h.slice(1)) : host === h));

/** The URL, if it is https on one of the hosts; otherwise an error naming the host. */
function checked(address: string, { service, hosts }: DownloadOptions, redirectedFrom?: string): URL {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    throw new Error(`${service} gave a file address that is not a URL; nothing was written`);
  }
  const from = redirectedFrom ? ` (a redirect from ${redirectedFrom})` : "";
  if (url.protocol !== "https:") throw new Error(`Refused to download from ${url.hostname}${from} over ${url.protocol.slice(0, -1)}: ${service} files must come over https; nothing was written`);
  if (!allowed(url.hostname, hosts)) throw new Error(`Refused to download from ${url.hostname}${from}: ${service} files come only from ${hosts.join(", ")}; nothing was written`);
  return url;
}

/**
 * Downloads `address` into `dest`, following redirects only while they stay on the provider's
 * hosts, and stopping (with `dest` deleted) once the file grows past `maxBytes`.
 */
export async function downloadFile(address: string, dest: string, options: DownloadOptions): Promise<void> {
  const { service, maxBytes, what } = options;
  let url = checked(address, options);
  let res = await reach(service, options.fetch, url.href, { redirect: "manual" });
  for (let hops = 0; res.status >= 300 && res.status < 400 && res.headers.has("location"); hops++) {
    if (hops === MAX_REDIRECTS) throw new Error(`Too many redirects downloading the file from ${service}; nothing was written`);
    url = checked(new URL(res.headers.get("location")!, url).href, options, url.hostname);
    res = await reach(service, options.fetch, url.href, { redirect: "manual" });
  }
  if (!res.ok) throw new Error(`Could not download the file from ${service}: HTTP ${res.status}`);

  const tooBig = () => new Error(`The file from ${service} is over the ${Math.round(maxBytes / 1024 ** 2)} MB limit for ${what}; nothing was written`);
  if (Number(res.headers.get("content-length")) > maxBytes) throw tooBig();
  if (!res.body) {
    writeFileSync(dest, "");
    return;
  }
  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      done(size > maxBytes ? tooBig() : null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), limit, createWriteStream(dest));
  } catch (e) {
    rmSync(dest, { force: true });
    throw e;
  }
}

export type FileType = "png" | "jpeg" | "webp" | "mp4";

/** What a file is by its first bytes, among the types generate accepts; undefined for anything else. */
export function sniffFile(path: string): FileType | undefined {
  const head = Buffer.alloc(12);
  const fd = openSync(path, "r");
  let read: number;
  try {
    read = readSync(fd, head, 0, head.length, 0);
  } finally {
    closeSync(fd);
  }
  const at = (offset: number, text: string) => read >= offset + text.length && head.toString("latin1", offset, offset + text.length) === text;
  if (at(0, "\x89PNG\r\n\x1a\n")) return "png";
  if (at(0, "\xff\xd8\xff")) return "jpeg";
  if (at(0, "RIFF") && at(8, "WEBP")) return "webp";
  if (at(4, "ftyp")) return "mp4";
  return undefined;
}
