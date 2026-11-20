// What every Night tech slide view receives, and small helpers they share.
import type React from "react";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";
import type { Drawing } from "./layout.js";

export type KindView<D extends Drawing["kind"] = Drawing["kind"]> = React.FC<{
  ctx: SlideContext;
  boxes: SlideBox[];
  fitted: Record<string, FittedText>;
  drawing: Extract<Drawing, { kind: D }>;
}>;

/** The widest fitted line of a box: how wide its text really is. */
export const textWidth = (fitted: FittedText | undefined): number => Math.max(0, ...(fitted?.lines.map((l) => l.width) ?? []));

/** The height of one fitted line. */
export const lineHeight = (fitted: FittedText | undefined): number => (fitted && fitted.lines.length ? fitted.height / fitted.lines.length : 0);

/** The box called `id` and its fitted lines, when both are there. */
export function boxOf(boxes: SlideBox[], fitted: Record<string, FittedText>, id: string): { box: SlideBox; fitted: FittedText } | undefined {
  const box = boxes.find((b) => b.id === id);
  const f = fitted[id];
  return box && f ? { box, fitted: f } : undefined;
}
