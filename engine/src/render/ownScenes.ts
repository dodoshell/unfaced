import { existsSync } from "node:fs";
import { join } from "node:path";
import type { OwnBoxes } from "../check/overlap.js";
import { readText } from "../text.js";

/**
 * A video's own scene code, looked at before anything is made or rendered so a mistake in it
 * stops make, frames and cover at once: a scenes/ folder needs index.tsx, and scenes/boxes.json
 * must be valid. Boxes for beats the video does not have (`beatIds`) are not checked, so they
 * get a warning. Returns scenes/index.tsx, or undefined for a video without a scenes/ folder.
 */
export function ownScenes(videoDir: string, beatIds: string[], warn: (msg: string) => void): string | undefined {
  const folder = join(videoDir, "scenes");
  if (!existsSync(folder)) return undefined;
  const entry = join(folder, "index.tsx");
  if (!existsSync(entry)) throw new Error(`${folder} has no index.tsx; a video's scenes start there, with export default defineScenes({ b2: MyScene }) (see "unfaced docs scenes")`);
  const file = join(folder, "boxes.json");
  const unknown = Object.keys(readOwnBoxes(file)).filter((id) => !beatIds.includes(id));
  if (unknown.length > 0) {
    warn(`${file}: this video has no beat ${unknown.map((id) => `"${id}"`).join(", ")}, so those boxes are not checked; its beats are ${beatIds.join(", ")}`);
  }
  return entry;
}

/** The text boxes a video's own scenes declare in scenes/boxes.json: { "<beat id>": [{ "id", "x", "y", "w", "h" }] }. */
export function readOwnBoxes(file: string): OwnBoxes {
  if (!existsSync(file)) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(readText(file));
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${(err as Error).message}`);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${file} must hold the boxes by beat id, such as { "b2": [{ "id": "label", "x": 120, "y": 880, "w": 340, "h": 90 }] }`);
  }
  for (const [beat, boxes] of Object.entries(raw)) {
    const ok = Array.isArray(boxes) && boxes.every((b) => b && typeof b.id === "string" && ["x", "y", "w", "h"].every((k) => typeof b[k] === "number"));
    if (!ok) throw new Error(`${file}: beat "${beat}" must be a list of boxes, each with an id and x, y, w and h in pixels`);
  }
  return raw as OwnBoxes;
}
