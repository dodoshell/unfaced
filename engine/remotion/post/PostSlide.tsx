import type React from "react";
import { AbsoluteFill } from "remotion";
import type { PostPlan } from "../../src/post/buildPostPlan.js";
import { frameWords } from "../../src/post/frameWords.js";
import type { SlideContext } from "../styles/registry.js";
import { getSlideView } from "../styles/slideViews.js";
import { loadSlideFonts } from "./brandFonts.js";

export type PostSlideProps = { plan: PostPlan; index: number };

/** What the style's SlideView draws slide `index` from: the same context its layout was given. */
export function slideContext(plan: PostPlan, index: number): SlideContext {
  return {
    slide: plan.slides[index]!.slide,
    total: plan.slides.length,
    format: plan.format,
    palette: plan.palette,
    brand: plan.brand,
    words: frameWords(plan.language).words,
    ...(plan.label !== undefined && { label: plan.label }),
  };
}

/** One slide drawn by its style, at the format's size; the fonts must already be loading. */
export const SlideFrame: React.FC<PostSlideProps> = ({ plan, index }) => {
  const SlideView = getSlideView(plan.style);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <SlideView ctx={slideContext(plan, index)} fitted={plan.slides[index]!.fitted} />
    </AbsoluteFill>
  );
};

/** The `post-slide` composition: one still, sized by the plan's format (calculateMetadata in Root). */
export const PostSlide: React.FC<PostSlideProps> = ({ plan, index }) => {
  if (!plan.slides[index]) return null;
  loadSlideFonts(plan);
  return <SlideFrame plan={plan} index={index} />;
};
