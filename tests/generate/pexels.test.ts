import { describe, expect, it, vi } from "vitest";
import { findPhoto, stockQuery } from "../../engine/src/generate/pexels.js";

const KEY = "pexels-test-key";
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const PHOTO = {
  id: 2014422,
  url: "https://www.pexels.com/photo/brown-cat-2014422/",
  photographer: "Jane Doe",
  photographer_url: "https://www.pexels.com/@jane",
  src: { original: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg" },
};

async function failure(fetchImpl: typeof fetch): Promise<string> {
  const err = await findPhoto("cat", KEY, fetchImpl).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain(KEY);
  return (err as Error).message;
}

describe("stockQuery", () => {
  it("skips a post prompt's For slide N sentence", () => {
    expect(stockQuery("For slide 2. A shop front at dusk.")).toBe("A shop front at dusk");
  });

  it("searches the prompt's Search: line when it has one", () => {
    expect(stockQuery("For beat b2.\nA ginger cat kneading a blanket, flat cartoon style.\nSearch: cat kneading blanket\n")).toBe("cat kneading blanket");
  });

  it("otherwise searches the subject: the first sentence after the beat, up to its first comma", () => {
    expect(stockQuery("For beat b2. A ginger cat with a white chest kneading a fluffy blanket, side view, 9:16 portrait.")).toBe("A ginger cat with a white chest kneading a fluffy blanket");
    expect(stockQuery("A slow pan over a sleeping cat.")).toBe("A slow pan over a sleeping cat");
  });
});

describe("findPhoto", () => {
  it("searches portrait photos and returns the first, cropped to 1080×1920, with its credit line", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json(200, { photos: [PHOTO] }));
    const photo = await findPhoto("ginger cat kneading", KEY, fetchImpl);

    const [url, init] = fetchImpl.mock.calls[0]!;
    const search = new URL(String(url));
    expect(search.origin + search.pathname).toBe("https://api.pexels.com/v1/search");
    expect(Object.fromEntries(search.searchParams)).toEqual({ query: "ginger cat kneading", orientation: "portrait", per_page: "1" });
    expect(new Headers(init?.headers).get("authorization")).toBe(KEY);
    expect(photo).toEqual({
      url: `${PHOTO.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1920`,
      credit: "Photo by Jane Doe on Pexels: https://www.pexels.com/photo/brown-cat-2014422/",
    });
  });

  it("says when nothing matches", async () => {
    expect(await failure(vi.fn<typeof fetch>(async () => json(200, { photos: [] })))).toBe(`Pexels found no photo for "cat"; add a shorter Search: line under its prompt`);
  });

  it("names the variable when the key is refused", async () => {
    expect(await failure(vi.fn<typeof fetch>(async () => json(401, { error: "Unauthorized" })))).toMatch(/^Pexels refused PEXELS_API_KEY \(401\): check the key in \.env/);
  });

  it("names the limit when there are too many requests", async () => {
    expect(await failure(vi.fn<typeof fetch>(async () => new Response("Too Many Requests", { status: 429 })))).toMatch(/^Pexels rate limit \(429\): 200 requests an hour/);
  });

  it("says when Pexels can't be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await failure(fetchImpl)).toBe("Could not reach Pexels: fetch failed");
  });
});
