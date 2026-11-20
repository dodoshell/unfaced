import { describe, expect, it } from "vitest";
import { frameWords } from "../../engine/src/post/frameWords.js";

describe("frameWords", () => {
  it("gives the frame's words in the page's language", () => {
    expect(frameWords("it")).toEqual({ words: { swipe: "scorri", of: "di" }, fallback: false });
    expect(frameWords("en").words.swipe).toBe("swipe");
    expect(frameWords("pt-BR").fallback).toBe(false);
    expect(frameWords("hi").fallback).toBe(false);
  });

  it("takes the base language of a regional code", () => {
    expect(frameWords("es-MX")).toEqual(frameWords("es"));
    expect(frameWords("pt-PT")).toEqual(frameWords("pt"));
  });

  it("falls back to English for any other language", () => {
    expect(frameWords("de")).toEqual({ words: frameWords("en").words, fallback: true });
  });
});
