// The rules every visual style follows, run for each style that has a layout. A new style
// passes this before it is marked ready in catalog.json.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTION_BOX } from "../../engine/remotion/core/captionLayout.js";
import { isInsideSafeZone, type Rect } from "../../engine/remotion/core/safeZone.js";
import { getLayout, stylesWithLayout } from "../../engine/remotion/styles/layouts.js";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import type { Scene } from "../../engine/src/plan/types.js";

const catalog = Catalog.load(CATALOG_DIR);
const scene = (beatId: string, kind: Scene["kind"], text: string): Scene => ({ beatId, kind, text, fromFrame: 0, durationInFrames: 90, words: [] });
const longHook = "Why does your cat press its paws into your soft blanket every single night like it is making bread for you?";
const item = (n: number) => `- item ${n} with a fairly long description`;
const list = (n: number, header = "Things cats do:") => [header, ...Array.from({ length: n }, (_, i) => item(i + 1))].filter(Boolean).join("\n");

const SCENES: Scene[] = [
  scene("hook", "title", "Why do cats purr?"),
  scene("hook", "title", longHook),
  scene("b1", "fact", "Cats sleep up to sixteen hours a day."),
  ...[1, 2, 3, 4, 5].map((n) => scene("b2", "list", list(n))),
  scene("b2", "list", list(3, "")),
  scene("ending", "outro", "That's cats."),
];

const PALETTES = {
  default: undefined,
  "two colours": ["#FFFFFF", "#FF0055"],
  dark: ["#101018", "#FF6B35", "#2EC4B6", "#FFD23F", "#F5F5F5"],
};

/** Symbols no font a style ships has: drawn as text, they fall back to whatever font the machine has, or a box. */
const MISSING_GLYPHS = /[★☆✓✔❤]/;
const componentSources = (folder: string) =>
  readdirSync(join(folder, "components"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => [f, readFileSync(join(folder, "components", f), "utf8")] as const);

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const label = (s: Scene) => `${s.kind} "${s.text.split("\n")[0]!.slice(0, 24)}" (${s.text.split("\n").length} lines)`;

describe.each(stylesWithLayout())("style %i", (id) => {
  const entry = catalog.get("style", id);
  const folder = join(CATALOG_DIR, dirname(entry.path));
  const layout = getLayout(id);

  it("is ready in the catalog, and its style.json matches the catalog entry", () => {
    expect(entry.status).toBe("ready");
    const json = JSON.parse(readFileSync(join(folder, "style.json"), "utf8")) as { id: number; slug: string; name: string; defaultPalette: string[] };
    expect(json).toMatchObject({ id, slug: entry.slug, name: entry.name });
    expect(json.defaultPalette.length).toBeGreaterThanOrEqual(5);
  });

  it("documents its look in STYLE.md with the standard sections", () => {
    const file = join(folder, "STYLE.md");
    expect(existsSync(file)).toBe(true);
    const text = readFileSync(file, "utf8");
    for (const section of ["Look", "Colour", "Type", "Layout", "Motion", "Pitfalls"]) expect(text, section).toMatch(new RegExp(`^## ${section}$`, "m"));
  });

  describe.each(Object.entries(PALETTES))("with the %s palette", (_, palette) => {
    const colours = palette ?? (JSON.parse(readFileSync(join(folder, "style.json"), "utf8")) as { defaultPalette: string[] }).defaultPalette;

    it.each(SCENES.map((s) => [label(s), s] as const))("lays out a %s inside the safe zone, clear of the captions and of each other", (_, s) => {
      const boxes = layout(s, colours);
      expect(boxes.length).toBeGreaterThan(0);
      expect(new Set(boxes.map((b) => b.id)).size, "unique ids").toBe(boxes.length);
      for (const box of boxes) {
        expect(box.w > 0 && box.h > 0, `${box.id} has a size`).toBe(true);
        expect(isInsideSafeZone(box), `${box.id} inside the safe zone`).toBe(true);
        expect(overlaps(box, CAPTION_BOX), `${box.id} clear of the captions`).toBe(false);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!), `${boxes[i]!.id} vs ${boxes[j]!.id}`).toBe(false);
      }
    });
  });

  it("draws symbols such as the fact star as shapes, not as characters its fonts lack", () => {
    for (const [file, source] of componentSources(folder)) expect(source, file).not.toMatch(MISSING_GLYPHS);
  });

  it("gives each list item its own box", () => {
    for (const n of [1, 3, 5]) expect(layout(scene("b2", "list", list(n)), []).filter((b) => b.id.startsWith("item"))).toHaveLength(n);
  });
});

describe("the style template", () => {
  it("draws symbols such as the fact star as shapes, not as characters its fonts lack", () => {
    for (const [file, source] of componentSources(join(CATALOG_DIR, "styles", "_template"))) expect(source, file).not.toMatch(MISSING_GLYPHS);
  });
});
