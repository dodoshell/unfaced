import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView } from "./kit.js";
import { colours } from "./tokens.js";

/** One idea: the headline standing on the seam a little over a third down, the body under it. */
export const Point: KindView = ({ ctx, boxes, fitted }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const body = boxOf(boxes, fitted, "body");
  return (
    <>
      {headline && <Headline {...headline} accent={c.secondary} />}
      {body && <FittedLines {...body} />}
    </>
  );
};
