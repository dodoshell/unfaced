import { describe, expect, it } from "vitest";
import { captionPhrases } from "../../engine/remotion/core/captionLayout.js";

const words = (text: string) => text.split(" ").map((t, i) => ({ text: t, startMs: i * 300, endMs: i * 300 + 250 }));
const texts = (text: string, max?: number) => captionPhrases(words(text), max).map((p) => p.map((w) => w.text).join(" "));

describe("captionPhrases", () => {
  it("ends a phrase after punctuation", () => {
    expect(texts("Actually, that's only half the story. Cats also purr.")).toEqual(["Actually,", "that's only half the story.", "Cats also purr."]);
  });

  it("splits long runs without punctuation into balanced phrases of at most 5 words", () => {
    expect(texts("one two three four five six seven")).toEqual(["one two three four", "five six seven"]);
    expect(texts("a b c d e f g h i j k")).toEqual(["a b c d", "e f g h", "i j k"]);
  });

  it("never leaves a single word alone after a split", () => {
    expect(texts("one two three four five six.")).toEqual(["one two three", "four five six."]);
  });

  it("keeps every word, in order", () => {
    const input = "So when your cat purrs at you at five in the morning, it isn't love. It's breakfast.";
    expect(texts(input).join(" ")).toBe(input);
  });
});
