import { type Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoPlan } from "../../src/plan/types.js";
import { CAPTION_BOX, CAPTION_COMBINE_MS, CAPTION_FONT_SIZE } from "./captionLayout.js";
import { CAPTION_FONT } from "./fonts.js";

/** Captions 01, word-by-word karaoke: the current phrase, the spoken word lit up. */
export const Captions: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  // Pages are built scene by scene so a phrase never runs across a scene change.
  const pages = useMemo(
    () =>
      plan.scenes.flatMap((scene) => {
        const captions: Caption[] = scene.words.map((w) => ({ text: ` ${w.text}`, startMs: w.startMs, endMs: w.endMs, timestampMs: null, confidence: null }));
        return createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: CAPTION_COMBINE_MS }).pages;
      }),
    [plan],
  );

  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs);
  if (!page) return null;

  const [, accent, , highlight = accent, ink = "#000000"] = plan.palette;
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
          fontSize: CAPTION_FONT_SIZE,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
          color: "#FFFFFF",
          WebkitTextStroke: `10px ${ink}`,
          paintOrder: "stroke fill",
        }}
      >
        <div>
          {page.tokens.map((t, i) => {
            const active = nowMs >= t.fromMs && nowMs < t.toMs;
            return (
              <span key={i} style={{ whiteSpace: "pre", color: active ? highlight : undefined }}>
                {i === 0 ? t.text.trimStart() : t.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
