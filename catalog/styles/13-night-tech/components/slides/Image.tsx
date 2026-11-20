import { Img, staticFile } from "remotion";
import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { slidePhotoFile } from "../../../../../engine/remotion/post/slideFonts.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView } from "./kit.js";
import { colours, SIZE } from "./tokens.js";

/** The photo in a rounded frame with a hairline rim, the headline standing under it and the caption below. */
export const Image: KindView<"image"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const body = boxOf(boxes, fitted, "body");
  const { photo } = drawing;
  return (
    <>
      <div style={{ position: "absolute", left: photo.x, top: photo.y, width: photo.w, height: photo.h, borderRadius: SIZE.radius, overflow: "hidden", backgroundColor: c.surface }}>
        <Img src={staticFile(slidePhotoFile(ctx.slide))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: SIZE.radius, boxShadow: `inset 0 0 0 1.5px ${c.line}` }} />
      </div>
      {headline && <Headline {...headline} accent={c.secondary} />}
      {body && <FittedLines {...body} />}
    </>
  );
};
