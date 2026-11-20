import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView } from "./kit.js";
import { colours } from "./tokens.js";

/** A big figure in the serif standing on the seam, a short accent bar, and its one line under it. */
export const Stat: KindView<"stat"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const figure = boxOf(boxes, fitted, "headline");
  const body = boxOf(boxes, fitted, "body");
  const { bar } = drawing;
  return (
    <>
      {figure && <Headline {...figure} accent={c.secondary} />}
      <div style={{ position: "absolute", left: bar.x, top: bar.y, width: bar.w, height: bar.h, borderRadius: bar.h, backgroundColor: c.accent, boxShadow: `0 0 18px ${c.accent}` }} />
      {body && <FittedLines {...body} />}
    </>
  );
};
