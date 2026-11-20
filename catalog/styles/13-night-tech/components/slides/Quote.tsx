import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView } from "./kit.js";
import { colours } from "./tokens.js";

/** Two serif quotation marks as filled shapes in a 24 × 24 box, so no font has to have them. */
const MARK =
  "M9.6 4.5C5.7 6.1 3.2 9.3 3.2 13.4c0 3.2 1.9 5.3 4.5 5.3 2.3 0 4-1.7 4-3.9 0-2.1-1.5-3.7-3.6-3.7-.4 0-.7 0-1 .1.5-2.3 2.2-4.2 4.5-5.3L9.6 4.5Zm11.2 0c-3.9 1.6-6.4 4.8-6.4 8.9 0 3.2 1.9 5.3 4.5 5.3 2.3 0 4-1.7 4-3.9 0-2.1-1.5-3.7-3.6-3.7-.4 0-.7 0-1 .1.5-2.3 2.2-4.2 4.5-5.3l-2-1.4Z";

/** The quote in the serif, standing on a low seam with a quotation mark riding above it, the author after a short rule. */
export const Quote: KindView<"quote"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const quote = boxOf(boxes, fitted, "headline");
  const author = boxOf(boxes, fitted, "author");
  const { mark, dash } = drawing;
  const markY = quote ? quote.box.y + quote.box.h - quote.fitted.height - mark.gap - mark.size : 0;
  return (
    <>
      {quote && (
        <svg width={mark.size} height={mark.size} viewBox="3 3 20 20" style={{ position: "absolute", left: mark.x, top: markY }}>
          <path d={MARK} fill={c.secondary} />
        </svg>
      )}
      {quote && <Headline {...quote} accent={c.secondary} />}
      {dash && <div style={{ position: "absolute", left: dash.x, top: dash.y, width: dash.w, height: dash.h, backgroundColor: c.accent }} />}
      {author && <FittedLines {...author} />}
    </>
  );
};
