import { reach } from "../http.js";

const SEARCH_LINE = /^\s*search:\s*(.+?)\s*$/i;

/** Where Pexels serves its photos (the `src` links in https://www.pexels.com/api/documentation/#photos-search). */
export const PEXELS_FILE_HOSTS = ["images.pexels.com"] as const;

/**
 * What to search stock photos for: the prompt's `Search:` line, or else its subject (the first
 * sentence after a "For beat ..." one, up to its first comma).
 */
export function stockQuery(prompt: string): string {
  for (const line of prompt.split(/\r?\n/)) {
    const search = SEARCH_LINE.exec(line);
    if (search) return search[1]!;
  }
  const sentences = prompt.replace(/\s+/g, " ").trim().split(/(?<=\.) /);
  const subject = sentences.find((s) => !/^for beat\b/i.test(s)) ?? sentences[0]!;
  return subject.split(",")[0]!.replace(/\.$/, "").trim();
}

/** The prompt without its `Search:` line, for a model that makes the picture. */
export const withoutSearchLine = (prompt: string): string =>
  prompt
    .split(/\r?\n/)
    .filter((line) => !SEARCH_LINE.test(line))
    .join("\n")
    .trim();

/**
 * The first portrait photo Pexels finds for `query`: where to download it, cropped to 1080×1920,
 * and the credit line Pexels asks for. https://www.pexels.com/api/documentation/#photos-search
 */
export async function findPhoto(query: string, key: string, fetchImpl: typeof fetch, webp = false): Promise<{ url: string; credit: string }> {
  const params = new URLSearchParams({ query, orientation: "portrait", per_page: "1" });
  const res = await reach("Pexels", fetchImpl, `https://api.pexels.com/v1/search?${params}`, { headers: { authorization: key } });
  if (res.status === 401 || res.status === 403) throw new Error(`Pexels refused PEXELS_API_KEY (${res.status}): check the key in .env`);
  if (res.status === 429) throw new Error("Pexels rate limit (429): 200 requests an hour and 20,000 a month on a free key; run generate again later");
  if (!res.ok) throw new Error(`Pexels answered ${res.status}: ${res.statusText}`);
  const { photos = [] } = (await res.json()) as { photos?: { url: string; photographer: string; src: { original: string } }[] };
  const photo = photos[0];
  if (!photo) throw new Error(`Pexels found no photo for "${query}"; add a shorter Search: line under its prompt`);
  // The same resizing parameters Pexels puts in its own src.portrait links; fm=webp asks for WebP.
  return {
    url: `${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1920${webp ? "&fm=webp" : ""}`,
    credit: `Photo by ${photo.photographer} on Pexels: ${photo.url}`,
  };
}
