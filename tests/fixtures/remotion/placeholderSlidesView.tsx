import { AbsoluteFill } from "remotion";
import { FittedLines, type SlideKit } from "../../../engine/remotion/kit/index.js";
import { placeholderSlides } from "./placeholderSlides.js";

/** Draws the test-only slide style: its ground, a band behind the headline and every box's fitted lines. */
export const PlaceholderSlideView: SlideKit["SlideView"] = ({ ctx, fitted, custom: Custom }) => (
  <AbsoluteFill style={{ backgroundColor: ctx.palette[0] }}>
    {placeholderSlides.layout(ctx).map((box) => (
      <FittedLines key={box.id} box={box} fitted={fitted[box.id]!} accentColor={ctx.palette[2]} style={box.id === "headline" ? { backgroundColor: ctx.palette[1] } : {}} />
    ))}
    {Custom ? <Custom /> : null}
  </AbsoluteFill>
);
