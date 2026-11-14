import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoPlan } from "../../src/plan/types.js";
import { CAPTION_BOX, CAPTION_FONT_SIZE, captionColours, captionPages, fitCaptionSize } from "./captionLayout.js";
import { CAPTION_FONT } from "./fonts.js";

/** Captions 01, word-by-word karaoke: the current phrase, the spoken word lit up. */
export const Captions: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const pages = useMemo(() => captionPages(plan.scenes, fps), [plan, fps]);

  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs);
  if (!page) return null;

  const { highlight, ink } = captionColours(plan.palette);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: CAPTION_BOX.x,
          top: CAPTION_BOX.y,
          width: CAPTION_BOX.w,
          height: CAPTION_BOX.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: CAPTION_FONT,
          fontWeight: 700,
          fontSize: fitCaptionSize(page.tokens.map((t) => t.text.trim()), CAPTION_BOX.w, CAPTION_BOX.h, CAPTION_FONT_SIZE, 1.15),
          lineHeight: 1.15,
          overflowWrap: "anywhere",
          color: "#FFFFFF",
          WebkitTextStroke: `10px ${ink}`,
          paintOrder: "stroke fill",
        }}
      >
        {/* Plain spaces between the words, so the browser can balance the lines. */}
        <div style={{ textWrap: "balance" }}>
          {page.tokens.map((t, i) => {
            const active = nowMs >= t.fromMs && nowMs < t.toMs;
            return (
              <span key={i}>
                {i > 0 ? " " : ""}
                <span style={{ color: active ? highlight : undefined }}>{t.text.trim()}</span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
