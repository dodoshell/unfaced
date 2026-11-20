import { readFileSync } from "node:fs";
import { extname } from "node:path";

/** Width over height of a PNG (from its header) or an SVG (its viewBox, else its width and height); undefined when it cannot be told. */
export function logoAspect(file: string): number | undefined {
  let data: Buffer;
  try {
    data = readFileSync(file);
  } catch {
    return undefined;
  }
  const ratio = (w: number, h: number) => (w > 0 && h > 0 && Number.isFinite(w / h) ? w / h : undefined);
  if (extname(file).toLowerCase() === ".png") {
    if (data.length < 24 || data.toString("latin1", 12, 16) !== "IHDR") return undefined;
    return ratio(data.readUInt32BE(16), data.readUInt32BE(20));
  }
  const svg = /<svg\b[^>]*>/i.exec(data.toString("utf8"))?.[0];
  if (!svg) return undefined;
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(svg)?.[1];
  const box = attr("viewBox")?.trim().split(/[\s,]+/).map(Number);
  if (box?.length === 4) {
    const fromBox = ratio(box[2]!, box[3]!);
    if (fromBox) return fromBox;
  }
  const px = (v?: string) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? Number.parseFloat(v) : Number.NaN);
  return ratio(px(attr("width")), px(attr("height")));
}
