import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FitError, fitText, type TextSpec } from "../../engine/src/post/fitText.js";
import { loadMetrics } from "../../engine/src/post/fonts.js";

const here = dirname(fileURLToPath(import.meta.url));
const condensed = join(here, "..", "fixtures", "fonts", "Condensed-Anton.ttf");
const wide = join(here, "..", "fixtures", "fonts", "Wide-Orbitron.ttf");
const box = { x: 100, y: 100, w: 880, h: 400 };

function spec(over: Partial<TextSpec>): TextSpec {
  return { text: "Do less now", font: condensed, box, maxSize: 120, minSize: 40, lineHeight: 1.1, ...over };
}

describe("fitText", () => {
  it("keeps max size for a short headline", () => {
    const r = fitText(spec({}));
    expect(r.size).toBe(120);
    expect(r.lines).toHaveLength(1);
  });

  it("shrinks and wraps a long headline inside the box", () => {
    const text = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty";
    const r = fitText(spec({ text }));
    expect(r.size).toBeLessThan(120);
    expect(r.lines.length).toBeGreaterThan(1);
    expect(r.height).toBeLessThanOrEqual(400);
    for (const l of r.lines) expect(l.width).toBeLessThanOrEqual(880);
    expect(r.lines.map((l) => l.text).join(" ")).toBe(text);
  });

  it("fits more characters per line in a condensed face than a wide one", () => {
    const text = "abcdefghij ".repeat(30).trim();
    const a = fitText(spec({ text, font: condensed, maxSize: 60, minSize: 60, box: { ...box, h: 4000 } }));
    const b = fitText(spec({ text, font: wide, maxSize: 60, minSize: 60, box: { ...box, h: 4000 } }));
    expect(a.lines.length).toBeLessThan(b.lines.length);
  });

  it("throws overflow for an unbreakable long word", () => {
    const err = catchErr(() => fitText(spec({ text: "x".repeat(60), minSize: 40 })));
    expect(err).toBeInstanceOf(FitError);
    expect(err.kind).toBe("overflow");
    expect(err.message).toContain("shorten it or split the slide");
  });

  it("throws glyph naming each missing character", () => {
    const err = catchErr(() => fitText(spec({ text: "Fatto ✓ 🚀" })));
    expect(err.kind).toBe("glyph");
    expect(err.message).toContain("✓");
    expect(err.message).toContain("🚀");
  });

  it("respects maxLines", () => {
    const text = "one two three four five six seven eight nine ten";
    const r = fitText(spec({ text, maxLines: 1, maxSize: 100, minSize: 20 }));
    expect(r.lines).toHaveLength(1);
  });

  it("carries the accent onto the right line and offsets", () => {
    const text = "alpha beta gamma delta";
    const start = text.indexOf("gamma");
    const r = fitText(spec({ text, accent: { start, end: start + 5 }, maxSize: 80, minSize: 80, box: { ...box, w: 400, h: 4000 } }));
    const hit = r.lines.filter((l) => l.accent);
    expect(hit).toHaveLength(1);
    const l = hit[0]!;
    expect(l.text.slice(l.accent!.start, l.accent!.end)).toBe("gamma");
  });

  it("splits an accent that spans a line break onto both lines", () => {
    const text = "alpha beta gamma delta";
    const r = fitText(spec({ text, accent: { start: 6, end: 16 }, maxSize: 80, minSize: 80, box: { ...box, w: 400, h: 4000 } }));
    const hit = r.lines.filter((l) => l.accent);
    expect(hit.length).toBeGreaterThan(1);
    const words = hit.map((l) => l.text.slice(l.accent!.start, l.accent!.end).trim()).join(" ");
    expect(words).toBe("beta gamma");
  });

  it("measures upper-cased text wider than lower-case", () => {
    const m = loadMetrics(condensed);
    expect(m.advance("HELLO")).toBeGreaterThan(m.advance("hello"));
    const lower = fitText(spec({ text: "hello world", maxSize: 100, minSize: 100 }));
    const upper = fitText(spec({ text: "hello world", maxSize: 100, minSize: 100, upper: true }));
    expect(upper.lines[0]!.width).toBeGreaterThan(lower.lines[0]!.width);
  });

  it("adds tracking per character", () => {
    const a = fitText(spec({ text: "hello", maxSize: 100, minSize: 100 }));
    const b = fitText(spec({ text: "hello", maxSize: 100, minSize: 100, tracking: 0.1 }));
    expect(b.lines[0]!.width - a.lines[0]!.width).toBeCloseTo(5 * 0.1 * 100, 3);
  });

  it("returns no lines for empty text", () => {
    const r = fitText(spec({ text: "" }));
    expect(r.lines).toHaveLength(0);
    expect(r.height).toBe(0);
  });
});

describe("loadMetrics", () => {
  it("rejects .woff2 and missing files with the path and a hint", () => {
    expect(() => loadMetrics("x/font.woff2")).toThrow(/x[\/]font\.woff2.*use \.ttf, \.otf or \.woff/);
    expect(() => loadMetrics(join(here, "nope.ttf"))).toThrow(/nope\.ttf.*use \.ttf, \.otf or \.woff/);
  });
});

function catchErr(fn: () => unknown): FitError {
  try {
    fn();
  } catch (e) {
    return e as FitError;
  }
  throw new Error("did not throw");
}
