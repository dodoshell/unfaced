import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Badge } from "../visuals/Icon.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView, lineHeight } from "./kit.js";
import { colours } from "./tokens.js";

/** Up to five items, each after a drawn number in an outlined circle (or a ✓ or ✗ for a marked item), with hairlines between rows. */
export const List: KindView<"list"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  return (
    <>
      {headline && <Headline {...headline} accent={c.secondary} />}
      {drawing.rows.map((row) => {
        const item = boxOf(boxes, fitted, row.id);
        if (!item) return null;
        const second = boxOf(boxes, fitted, `${row.id}-second`);
        // A single item is centred in its row; an item with a second line stands on it.
        const textTop = second ? item.box.y + item.box.h - item.fitted.height : item.box.y + (item.box.h - item.fitted.height) / 2;
        const y = textTop + lineHeight(item.fitted) / 2 - row.icon.size / 2;
        const tint = row.mark === "bad" ? c.bad : row.mark === "good" ? c.highlight : c.secondary;
        const icon = row.mark === "bad" ? "cross" : row.mark === "good" ? "check" : "number";
        return (
          <div key={row.id}>
            <Badge x={row.icon.x} y={y} size={row.icon.size} icon={icon} n={row.n} color={row.mark ? tint : c.ink} ring={tint} />
            <FittedLines {...item} style={{ display: "flex", flexDirection: "column", justifyContent: second ? "flex-end" : "center" }} />
            {second && <FittedLines {...second} />}
            {row.rule && <div style={{ position: "absolute", left: row.rule.x, top: row.rule.y, width: row.rule.w, height: 1, backgroundColor: c.line }} />}
          </div>
        );
      })}
    </>
  );
};
