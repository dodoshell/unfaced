// What the body scenes of a style number or label, shared so every style counts the same way.
import type { Scene } from "../../src/plan/types.js";

/** The lead-in line and the items ("- item" lines) of a list beat. */
export function listParts(text: string): { header: string; items: string[] } {
  const lines = text.split("\n");
  return {
    header: lines.filter((l) => !/^\s*-\s+/.test(l)).join(" ").trim(),
    items: lines.filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, "").trim()),
  };
}

/** A fact's place among the video's fact scenes, or its beat number (b2 → 2) without them. */
export function factNumber(scene: Scene, scenes?: Scene[]): number {
  const facts = scenes?.filter((s) => s.kind === "fact") ?? [];
  const place = facts.findIndex((s) => s.beatId === scene.beatId);
  return place >= 0 ? place + 1 : Number(/^b(\d+)$/.exec(scene.beatId)?.[1] ?? 1);
}

/** Script types whose body beats are numbered items: 01 build it and 07 how it works (steps), 09 did you know (facts). */
const COUNTING_UP = new Set([1, 7, 9]);
/** 02 top N countdown: its items count down to number one. */
const COUNTDOWN = 2;

/**
 * What a fact's number shows: its number when the script type numbers its beats (counting
 * down for a countdown), nothing for other script types (the style shows its own mark).
 */
export function factBadge(scene: Scene, scenes: Scene[], scriptType: number | undefined): string | undefined {
  const n = factNumber(scene, scenes);
  if (scriptType === COUNTDOWN) return String(scenes.filter((s) => s.kind === "fact").length + 1 - n);
  return scriptType === undefined || COUNTING_UP.has(scriptType) ? String(n) : undefined;
}
