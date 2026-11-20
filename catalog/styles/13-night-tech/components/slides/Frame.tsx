import type React from "react";
import { Img, staticFile } from "remotion";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";
import { markOf } from "./layout.js";
import { colours } from "./tokens.js";

/**
 * The frame every slide gets: the label top left, the counter top right, the handle bottom left
 * after an accent dot (or the brand's logo), and "swipe →" bottom right while a slide follows.
 */
export const Frame: React.FC<{ ctx: SlideContext; boxes: SlideBox[]; fitted: Record<string, FittedText> }> = ({ ctx, boxes, fitted }) => {
  const c = colours(ctx.palette);
  const at = (id: string) => boxes.find((b) => b.id === id);
  const draw = (id: string, align?: "right") => {
    const box = at(id);
    return box && fitted[id] ? <FittedLines key={id} box={box} fitted={fitted[id]!} {...(align && { align })} /> : null;
  };
  const handle = at("handle");
  const mark = markOf(ctx);
  return (
    <>
      {draw("label")}
      {draw("counter", "right")}
      {handle &&
        (ctx.logoFile ? (
          <Img src={staticFile(ctx.logoFile)} style={{ position: "absolute", left: mark.x, top: mark.y, width: mark.w, height: mark.h, objectFit: "contain" }} />
        ) : (
          <div style={{ position: "absolute", left: mark.x, top: mark.y, width: mark.w, height: mark.h, borderRadius: "50%", backgroundColor: c.accent, boxShadow: `0 0 12px ${c.accent}` }} />
        ))}
      {draw("handle")}
      {draw("swipe", "right")}
    </>
  );
};
