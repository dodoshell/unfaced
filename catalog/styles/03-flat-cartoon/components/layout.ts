// Pure layout for style 03: where each scene kind puts its text. The components
// draw exactly these boxes, and checks call this without rendering.
import type { Rect } from "../../../../engine/remotion/core/safeZone.js";
import type { TextBox } from "../../../../engine/remotion/styles/registry.js";
import type { Scene } from "../../../../engine/src/plan/types.js";

/** Outline width and hard-shadow offset, in pixels. */
export const INK = 8;
export const SHADOW = 14;

const DEFAULTS = ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"];
/** Palette roles: 0 background, 1 accent, 2 secondary, 3 highlight, 4 ink. Short page palettes fall back to the defaults. */
export const colour = (palette: string[], role: 0 | 1 | 2 | 3 | 4) => palette[role] ?? DEFAULTS[role]!;

const TITLE: Rect = { x: 110, y: 500, w: 780, h: 460 };
const BADGE: Rect = { x: 290, y: 400, w: 420, h: 420 };
const MARK: Rect = { x: 340, y: 440, w: 400, h: 400 };
const LIST_TOP = 300;
const LIST_BOTTOM = 1120; // captions start at 1180
const LIST_GAP = 28;

/** Header line and items of a list beat ("- item" lines). */
export function listParts(text: string): { header: string; items: string[] } {
  const lines = text.split("\n");
  return {
    header: lines.filter((l) => !/^\s*-\s+/.test(l)).join(" ").trim(),
    items: lines.filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, "").trim()),
  };
}

/** The number on a fact's badge: its place among the video's fact scenes, or its beat number (b2 → 2) without them. */
export function factNumber(scene: Scene, scenes?: Scene[]): number {
  const facts = scenes?.filter((s) => s.kind === "fact") ?? [];
  const place = facts.findIndex((s) => s.beatId === scene.beatId);
  return place >= 0 ? place + 1 : Number(/^b(\d+)$/.exec(scene.beatId)?.[1] ?? 1);
}

/** Script types whose body beats are numbered items: 07 how it works (steps), 09 did you know (facts); 02 counts down. */
const COUNTING_UP = new Set([7, 9]);
const COUNTDOWN = 2;

/**
 * What a fact's badge shows: its number when the script type numbers its beats (counting
 * down for a countdown), nothing for other script types (the badge holds a star instead).
 */
export function factBadge(scene: Scene, scenes: Scene[], scriptType: number | undefined): string | undefined {
  const n = factNumber(scene, scenes);
  if (scriptType === COUNTDOWN) return String(scenes.filter((s) => s.kind === "fact").length + 1 - n);
  return scriptType === undefined || COUNTING_UP.has(scriptType) ? String(n) : undefined;
}

/**
 * The largest font size (step 2 px) at which `text` should fit `box` when wrapped,
 * estimating Fredoka Bold at ~0.6 em per character.
 */
export function fitFontSize(text: string, box: { w: number; h: number }, max: number, min: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = max; size > min; size -= 2) {
    const charW = size * 0.6;
    let lines = 1;
    let used = 0;
    for (const word of words) {
      const width = (word.length + 1) * charW;
      if (used > 0 && used + width > box.w) {
        lines++;
        used = 0;
      }
      used += width;
    }
    const widest = Math.max(...words.map((wd) => wd.length * charW));
    if (lines * size * 1.15 <= box.h && widest <= box.w) return size;
  }
  return min;
}

export function layout(scene: Scene, _palette: string[]): TextBox[] {
  switch (scene.kind) {
    case "title":
      return [{ id: "headline", ...TITLE }];
    case "fact":
      return [{ id: "badge", ...BADGE }];
    case "outro":
      return [{ id: "mark", ...MARK }];
    case "list": {
      const { header, items } = listParts(scene.text);
      const boxes: TextBox[] = [];
      let top = LIST_TOP;
      if (header) {
        boxes.push({ id: "header", x: 110, y: top, w: 780, h: 130 });
        top += 130 + LIST_GAP + 10;
      }
      const n = Math.max(items.length, 1);
      const itemH = Math.min(150, Math.floor((LIST_BOTTOM - top - (n - 1) * LIST_GAP) / n));
      items.forEach((_, i) => boxes.push({ id: `item${i + 1}`, x: 110, y: top + i * (itemH + LIST_GAP), w: 780, h: itemH }));
      return boxes;
    }
  }
}
