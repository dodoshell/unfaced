import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Icon } from "../visuals/Icon.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView, lineHeight } from "./kit.js";
import { type CompareColumn, compareFill } from "./layout.js";
import { colours } from "./tokens.js";

/** Two columns of rounded rows, each ✗ row with a red cross and each ✓ row with a green tick (or before and after, an arrow between them). */
export const Compare: KindView<"compare"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const body = boxOf(boxes, fitted, "body");
  const tintOf = (side: CompareColumn["side"]) => (side === "bad" ? c.bad : side === "good" ? c.highlight : side === "after" ? c.accent : c.line);
  return (
    <>
      {headline && <Headline {...headline} accent={c.secondary} />}
      {body && <FittedLines {...body} />}
      {drawing.columns.map((column) => {
        const tint = tintOf(column.side);
        const fill = compareFill(ctx.palette, column.side);
        return (
          <div key={column.side}>
            {column.items.map(({ id, rect }) => {
              const text = boxOf(boxes, fitted, id);
              return (
                <div key={id}>
                  <div
                    style={{
                      position: "absolute",
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                      boxSizing: "border-box",
                      borderRadius: Math.min(22, rect.h / 2),
                      backgroundColor: fill,
                      border: `1.5px solid ${tint}`,
                    }}
                  />
                  {column.icon && (
                    <div style={{ position: "absolute", left: rect.x + column.icon.pad, top: (text ? text.box.y + (text.box.h - text.fitted.height) / 2 + lineHeight(text.fitted) / 2 : rect.y + rect.h / 2) - column.icon.size / 2 }}>
                      <Icon name={column.side === "bad" ? "cross" : "check"} size={column.icon.size} color={tint} stroke={3} />
                    </div>
                  )}
                  {text && <FittedLines {...text} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }} />}
                </div>
              );
            })}
          </div>
        );
      })}
      {drawing.arrow && (
        <div style={{ position: "absolute", left: drawing.arrow.x, top: drawing.arrow.y }}>
          <Icon name="arrow" size={drawing.arrow.size} color={c.secondary} stroke={2.5} />
        </div>
      )}
    </>
  );
};
