import type React from "react";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import type { SlideBox, SlideContext } from "../../../../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../../../../engine/src/post/fitText.js";
import { Headline } from "./Headline.js";
import { colours } from "./tokens.js";

/** One idea: the headline standing on the seam a little over a third down, the body under it. */
export const Point: React.FC<{ ctx: SlideContext; boxes: SlideBox[]; fitted: Record<string, FittedText> }> = ({ ctx, boxes, fitted }) => {
  const c = colours(ctx.palette);
  const headline = boxes.find((b) => b.id === "headline");
  const body = boxes.find((b) => b.id === "body");
  return (
    <>
      {headline && fitted.headline && <Headline box={headline} fitted={fitted.headline} accent={c.secondary} />}
      {body && fitted.body && <FittedLines box={body} fitted={fitted.body} />}
    </>
  );
};
