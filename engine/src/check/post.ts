import { contrast } from "../../remotion/core/contrast.js";
import type { Rect } from "../../remotion/core/safeZone.js";
import type { SlideBox } from "../../remotion/styles/registry.js";
import type { PostPlan } from "../post/buildPostPlan.js";
import type { CheckIssue, CheckName } from "./types.js";

const inside = (box: Rect, area: Rect): boolean => box.x >= area.x && box.y >= area.y && box.x + box.w <= area.x + area.w && box.y + box.h <= area.y + area.h;

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const where = (box: Rect): string => `x ${box.x}–${box.x + box.w}, y ${box.y}–${box.y + box.h}`;

/**
 * The checks a post plan can fail without rendering: every text box inside the format's safe
 * area, no two boxes of a slide overlapping, readable text colours, and the cover's headline
 * inside the profile grid's crop on 4:5 formats. A post has no time, so each issue names its
 * slide and is at 0 ms.
 */
export function checkPost(plan: PostPlan): CheckIssue[] {
  const { format } = plan;
  const safe: Rect = {
    x: format.safe.left,
    y: format.safe.top,
    w: format.width - format.safe.left - format.safe.right,
    h: format.height - format.safe.top - format.safe.bottom,
  };
  const issues: CheckIssue[] = [];
  const issue = (check: CheckName, n: number, message: string) =>
    issues.push({ check, atMs: 0, severity: "error", message: `${format.name} slide ${n}: ${message}` });

  for (const { slide, boxes, own = [] } of plan.slides) {
    const n = slide.index + 1;
    const placed: (Rect & { id: string })[] = [...boxes, ...own];
    for (const box of placed) {
      if (!inside(box, safe)) issue("post-safe-area", n, `text box "${box.id}" (${where(box)}) reaches outside the safe area (${where(safe)})`);
    }
    placed.forEach((a, i) => {
      for (const b of placed.slice(i + 1)) {
        if (overlaps(a, b)) issue("post-overlap", n, `text boxes "${a.id}" and "${b.id}" overlap`);
      }
    });
    for (const box of boxes) {
      const need = minContrast(box);
      const ratio = contrast(box.color, box.on);
      if (ratio < need) issue("contrast", n, `text box "${box.id}" is ${box.color} on ${box.on}, ${ratio.toFixed(2)}:1; ${box.readable} text needs ${need}:1`);
    }
    const headline = boxes.find((b) => b.id === "headline");
    if (slide.index === 0 && format.coverArea) {
      if (headline && !inside(headline, format.coverArea)) {
        issue("cover-crop", n, `the cover's headline (${where(headline)}) reaches outside the area the profile grid shows (${where(format.coverArea)})`);
      } else if (!headline && slide.headline) {
        issue("cover-crop", n, `the cover has a headline but the style lays out no box called "headline", so its place in the profile grid's crop cannot be checked`);
      }
    }
  }
  return issues;
}

const minContrast = (box: SlideBox): number => (box.readable === "large" ? 3 : 4.5);
