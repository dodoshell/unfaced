import { AbsoluteFill } from "remotion";
import { FittedLines, type SlideKit, slideFont } from "../../../engine/remotion/kit/index.js";
import { placeholderSlides } from "./placeholderSlides.js";

/** Draws the test-only slide style: its ground, a band behind the headline and every box's fitted lines. */
export const PlaceholderSlideView: SlideKit["SlideView"] = ({ ctx, fitted }) => (
  <AbsoluteFill style={{ backgroundColor: ctx.palette[0] }}>
    {placeholderSlides.layout(ctx).map((box) => (
      <div key={box.id} style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, ...(box.id === "headline" && { backgroundColor: ctx.palette[1] }) }}>
        <FittedLines fitted={fitted[box.id]!} color={box.color} font={slideFont(box.role)} accentColor={ctx.palette[2]} accentFont={slideFont("accent")} />
      </div>
    ))}
  </AbsoluteFill>
);
