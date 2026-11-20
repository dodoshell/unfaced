import { AbsoluteFill } from "remotion";
import type { SlideKit } from "../../../../../engine/remotion/styles/registry.js";
import type { SlideKind } from "../../../../../engine/src/post/types.js";
import { Compare } from "./Compare.js";
import { Cover } from "./Cover.js";
import { Cta } from "./Cta.js";
import { Frame } from "./Frame.js";
import { Ground } from "./Ground.js";
import { Image } from "./Image.js";
import type { KindView } from "./kit.js";
import { compose, nightTechLayout } from "./layout.js";
import { List } from "./List.js";
import { Point } from "./Point.js";
import { Quote } from "./Quote.js";
import { Stat } from "./Stat.js";
import { Steps } from "./Steps.js";

const views = { cover: Cover, point: Point, list: List, steps: Steps, compare: Compare, stat: Stat, quote: Quote, image: Image, cta: Cta } as Record<Exclude<SlideKind, "custom">, KindView>;

/**
 * Draws one Night tech slide: the ground, the slide's content (or the post's own component on a
 * custom slide) and the frame on top. See ../../STYLE.md.
 */
export const NightTechSlide: SlideKit["SlideView"] = ({ ctx, fitted, custom: Custom }) => {
  const { boxes, drawing } = compose(ctx);
  const View = ctx.slide.kind === "custom" ? undefined : views[ctx.slide.kind];
  return (
    <AbsoluteFill>
      <Ground palette={ctx.palette} format={ctx.format} />
      {View ? <View ctx={ctx} boxes={boxes} fitted={fitted} drawing={drawing} /> : null}
      {Custom ? <Custom /> : null}
      <Frame ctx={ctx} boxes={boxes} fitted={fitted} />
    </AbsoluteFill>
  );
};

/** Style 13's posts: fonts, layout and view. */
export const nightTechSlides: SlideKit = { ...nightTechLayout, SlideView: NightTechSlide };
