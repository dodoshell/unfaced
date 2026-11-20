import type React from "react";
import { AbsoluteFill } from "remotion";
import type { PostPlan } from "../../src/post/buildPostPlan.js";
import { loadSlideFonts } from "./brandFonts.js";
import { SlideFrame } from "./PostSlide.js";

/** grid.png: every slide at 0.3 scale, five per row, 24 px apart and around, on a dark ground. */
export const POST_GRID = { scale: 0.3, perRow: 5, gap: 24, ground: "#111111" } as const;

export type PostGridProps = { plan: PostPlan };

const cell = (plan: PostPlan) => ({ w: Math.round(plan.format.width * POST_GRID.scale), h: Math.round(plan.format.height * POST_GRID.scale) });

/** The grid's size for a plan's slides (at least one cell, so an empty plan still has a size). */
export function postGridSize(plan: PostPlan): { width: number; height: number } {
  const n = Math.max(1, plan.slides.length);
  const cols = Math.min(POST_GRID.perRow, n);
  const rows = Math.ceil(n / POST_GRID.perRow);
  const { w, h } = cell(plan);
  return { width: cols * w + (cols + 1) * POST_GRID.gap, height: rows * h + (rows + 1) * POST_GRID.gap };
}

/** The `post-grid` composition. */
export const PostGrid: React.FC<PostGridProps> = ({ plan }) => {
  if (plan.slides.length === 0) return <AbsoluteFill style={{ backgroundColor: POST_GRID.ground }} />;
  loadSlideFonts(plan);
  const { w, h } = cell(plan);
  return (
    <AbsoluteFill style={{ backgroundColor: POST_GRID.ground }}>
      {plan.slides.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: POST_GRID.gap + (i % POST_GRID.perRow) * (w + POST_GRID.gap),
            top: POST_GRID.gap + Math.floor(i / POST_GRID.perRow) * (h + POST_GRID.gap),
            width: w,
            height: h,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: plan.format.width, height: plan.format.height, transform: `scale(${POST_GRID.scale})`, transformOrigin: "top left" }}>
            <SlideFrame plan={plan} index={i} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
