import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Chip } from "../visuals/Chip.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView, textWidth } from "./kit.js";
import { CTA_GAP } from "./layout.js";
import { colours } from "./tokens.js";

/** The closing invite, centred: the headline, the filled pill button with a drawn arrow, a small line under it. */
export const Cta: KindView<"cta"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const button = boxOf(boxes, fitted, "button");
  const body = boxOf(boxes, fitted, "body");
  const { pill } = drawing;
  const tw = Math.ceil(textWidth(button?.fitted));
  const w = pill.padX + tw + CTA_GAP + pill.arrow + pill.padX;
  const x = Math.round(pill.cx - w / 2);
  return (
    <>
      {headline && <Headline {...headline} accent={c.secondary} align="center" />}
      {button && (
        <>
          <div style={{ position: "absolute", left: x, top: pill.y, width: w, height: pill.h, borderRadius: pill.h / 2, boxShadow: `0 ${Math.round(pill.h * 0.2)}px ${pill.h}px ${c.accent}66` }} />
          <Chip x={x} y={pill.y} w={w} h={pill.h} fill={c.accent} icon={{ name: "arrow", color: button.box.color, size: pill.arrow, pad: pill.padX, side: "right" }} />
          <FittedLines {...button} style={{ display: "flex", flexDirection: "column", justifyContent: "center", left: x + pill.padX, width: tw + 2 }} />
        </>
      )}
      {body && <FittedLines {...body} align="center" />}
    </>
  );
};
