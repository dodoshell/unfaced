import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TextBox } from "../../remotion/styles/registry.js";
import { FORMAT_NAMES } from "../post/formats.js";
import type { FormatName } from "../post/types.js";
import { readText } from "../text.js";

/** A post's own slide code: `<postDir>/custom/index.tsx`, or undefined for a post without a custom/ folder. A custom/ folder without index.tsx fails. */
export function ownSlides(postDir: string): string | undefined {
  const folder = join(postDir, "custom");
  if (!existsSync(folder)) return undefined;
  const entry = join(folder, "index.tsx");
  if (!existsSync(entry)) throw new Error(`${folder} has no index.tsx; a post's own slides start there, with export default defineSlides({ phone: PhoneSlide }) (see "unfaced docs slides")`);
  return entry;
}

/** The text boxes a post's custom slides declare in custom/boxes.json: { "<id>": { "<format name>": [{ "id", "x", "y", "w", "h" }] } }. */
export function readOwnSlideBoxes(file: string): Record<string, Partial<Record<FormatName, TextBox[]>>> {
  if (!existsSync(file)) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(readText(file));
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${(err as Error).message}`);
  }
  const shape = `${file} must hold the boxes by slide id and then by format, such as { "phone": { "instagram-carousel": [{ "id": "label", "x": 120, "y": 880, "w": 340, "h": 90 }] } }`;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(shape);
  for (const [id, byFormat] of Object.entries(raw)) {
    if (!byFormat || typeof byFormat !== "object" || Array.isArray(byFormat)) throw new Error(`${file}: slide "${id}" must list its boxes by format; ${shape.slice(file.length + 1)}`);
    for (const [format, boxes] of Object.entries(byFormat)) {
      if (!(FORMAT_NAMES as string[]).includes(format)) throw new Error(`${file}: slide "${id}" has no format "${format}"; the formats are ${FORMAT_NAMES.join(", ")}`);
      const ok = Array.isArray(boxes) && boxes.every((b) => b && typeof b.id === "string" && ["x", "y", "w", "h"].every((k) => typeof b[k] === "number"));
      if (!ok) throw new Error(`${file}: slide "${id}", format "${format}" must be a list of boxes, each with an id and x, y, w and h in pixels`);
    }
  }
  return raw as Record<string, Partial<Record<FormatName, TextBox[]>>>;
}
