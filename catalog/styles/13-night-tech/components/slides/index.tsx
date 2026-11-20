import { AbsoluteFill } from "remotion";
import type { SlideKit } from "../../../../../engine/remotion/styles/registry.js";
import { Cover } from "./Cover.js";
import { Frame } from "./Frame.js";
import { Ground } from "./Ground.js";
import { layout, nightTechLayout } from "./layout.js";
import { Point } from "./Point.js";

const views = { cover: Cover, point: Point };

/**
 * Draws one Night tech slide: the ground, the slide's content (or the post's own component on a
 * custom slide) and the frame on top. See ../../STYLE.md.
 */
export const NightTechSlide: SlideKit["SlideView"] = ({ ctx, fitted, custom: Custom }) => {
  const boxes = layout(ctx);
  const View = ctx.slide.kind in views ? views[ctx.slide.kind as keyof typeof views] : undefined;
  return (
    <AbsoluteFill>
      <Ground palette={ctx.palette} format={ctx.format} />
      {View ? <View ctx={ctx} boxes={boxes} fitted={fitted} /> : null}
      {Custom ? <Custom /> : null}
      <Frame ctx={ctx} boxes={boxes} fitted={fitted} />
    </AbsoluteFill>
  );
};

/** Style 13's posts: fonts, layout and view. */
export const nightTechSlides: SlideKit = { ...nightTechLayout, SlideView: NightTechSlide };
