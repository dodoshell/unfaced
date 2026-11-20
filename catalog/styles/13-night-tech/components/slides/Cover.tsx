import type React from "react";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";
import { Headline } from "./Headline.js";
import { colours } from "./tokens.js";

/** The cover: a large headline standing on the seam two thirds down, the subtitle hanging under it. */
export const Cover: React.FC<{ ctx: SlideContext; boxes: SlideBox[]; fitted: Record<string, FittedText> }> = ({ ctx, boxes, fitted }) => {
  const c = colours(ctx.palette);
  const headline = boxes.find((b) => b.id === "headline");
  const subtitle = boxes.find((b) => b.id === "subtitle");
  return (
    <>
      {headline && fitted.headline && <Headline box={headline} fitted={fitted.headline} accent={c.secondary} />}
      {subtitle && fitted.subtitle && <FittedLines box={subtitle} fitted={fitted.subtitle} />}
    </>
  );
};
