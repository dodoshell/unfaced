// Caption styles 02-06 (catalog/captions.md). Style 01, word-by-word karaoke, is in
// Captions.tsx. Each draws inside its box from captionLayout.ts, which the checks use.
import type { TikTokPage } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoPlan } from "../../src/plan/types.js";
import { Captions } from "./Captions.js";
import { captionPages, captionStyle, keywordIndex } from "./captionLayout.js";
import { CAPTION_FONT } from "./fonts.js";

interface Shown {
  page: TikTokPage;
  nowMs: number;
  /** Frames since the page appeared. */
  age: number;
  fps: number;
}

/** The caption page on screen now, if any. */
function useShownPage(plan: VideoPlan): Shown | undefined {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const style = captionStyle(plan.captions);
  const pages = useMemo(() => captionPages(plan.scenes, fps, style.maxWords), [plan, fps, style.maxWords]);
  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs);
  return page && { page, nowMs, age: frame - Math.floor((page.startMs / 1000) * fps), fps };
}

const colours = (plan: VideoPlan) => {
  const [, accent = "#FF6B35", , highlight = accent, ink = "#000000"] = plan.palette;
  return { accent, highlight, ink };
};

/** The largest size up to `base` at which the longest word still fits the box width. */
function fitSize(texts: string[], width: number, base: number, upper = false): number {
  const longest = Math.max(...texts.map((t) => t.length), 1);
  return Math.min(base, Math.floor(width / (longest * (upper ? 0.7 : 0.6))));
}

const Box: React.FC<{ n: number; children: React.ReactNode; align?: "center" | "flex-end"; style?: React.CSSProperties }> = ({ n, children, align = "center", style }) => {
  const { box } = captionStyle(n);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", alignItems: align, justifyContent: "center", textAlign: "center", ...style }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const texts = (page: TikTokPage) => page.tokens.map((t) => t.text.trim());

/** 02 Bold centre: two or three words at a time, very large, popping in. */
const BoldCentre: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const shown = useShownPage(plan);
  if (!shown) return null;
  const { ink } = colours(plan);
  const words = texts(shown.page);
  const pop = spring({ frame: shown.age, fps: shown.fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const size = fitSize(words, captionStyle(2).box.w, captionStyle(2).fontSize, true);
  return (
    <Box n={2}>
      <div
        style={{
          fontFamily: CAPTION_FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.02,
          textTransform: "uppercase",
          color: "#FFFFFF",
          WebkitTextStroke: `12px ${ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 8px 0 ${ink}`,
          transform: `scale(${0.8 + 0.2 * pop})`,
          textWrap: "balance",
        }}
      >
        {words.join(" ")}
      </div>
    </Box>
  );
};

/** 03 Typewriter: letters appear as the words are spoken, with a blinking cursor, on a dark card. */
const Typewriter: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const shown = useShownPage(plan);
  if (!shown) return null;
  const { accent, ink } = colours(plan);
  const { page, nowMs } = shown;
  // Each word types out over the time it is spoken; the layout never moves, unrevealed letters are transparent.
  const tokens = page.tokens.map((t) => {
    const text = t.text.trim();
    const k = Math.max(0, Math.min(1, (nowMs - t.fromMs) / Math.max(1, t.toMs - t.fromMs)));
    return { text, shown: Math.round(text.length * k) };
  });
  const lastTyping = tokens.reduce((last, t, i) => (t.shown > 0 ? i : last), 0);
  const cursorOn = Math.floor(nowMs / 400) % 2 === 0;
  const size = fitSize(texts(page), captionStyle(3).box.w - 80, captionStyle(3).fontSize);
  return (
    <Box n={3}>
      <div style={{ backgroundColor: ink, borderRadius: 24, padding: "28px 40px", fontFamily: CAPTION_FONT, fontWeight: 600, fontSize: size, lineHeight: 1.2, color: "#FFFFFF", textAlign: "left", maxWidth: "100%" }}>
        {tokens.map((t, i) => (
          <span key={i}>
            {i > 0 ? " " : ""}
            <span>{t.text.slice(0, t.shown)}</span>
            {i === lastTyping && <span style={{ color: accent, opacity: cursorOn ? 1 : 0 }}>▍</span>}
            <span style={{ color: "transparent" }}>{t.text.slice(t.shown)}</span>
          </span>
        ))}
      </div>
    </Box>
  );
};

/** 04 Minimal lower third: small, quiet subtitles near the bottom, no animation. */
const LowerThird: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const shown = useShownPage(plan);
  if (!shown) return null;
  return (
    <Box n={4} align="flex-end">
      <div
        style={{
          fontFamily: CAPTION_FONT,
          fontWeight: 500,
          fontSize: captionStyle(4).fontSize,
          lineHeight: 1.25,
          color: "#FFFFFF",
          backgroundColor: "rgba(0,0,0,0.55)",
          borderRadius: 14,
          padding: "10px 22px",
          textWrap: "balance",
        }}
      >
        {texts(shown.page).join(" ")}
      </div>
    </Box>
  );
};

/** 05 Outline pop: thick outlined words that bounce in as they are spoken. */
const OutlinePop: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const shown = useShownPage(plan);
  if (!shown) return null;
  const { highlight, ink } = colours(plan);
  const { page, nowMs, fps } = shown;
  const size = fitSize(texts(page), captionStyle(5).box.w, captionStyle(5).fontSize);
  return (
    <Box n={5}>
      <div style={{ fontFamily: CAPTION_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.1, textWrap: "balance" }}>
        {page.tokens.map((t, i) => {
          const age = ((nowMs - t.fromMs) / 1000) * fps;
          const pop = age < 0 ? 0 : spring({ frame: age, fps, config: { damping: 9, stiffness: 240, mass: 0.6 } });
          const speaking = nowMs >= t.fromMs && nowMs < t.toMs;
          return (
            <span key={i}>
              {i > 0 ? " " : ""}
              <span
                style={{
                  display: "inline-block",
                  color: speaking ? highlight : "#FFFFFF",
                  WebkitTextStroke: `14px ${ink}`,
                  paintOrder: "stroke fill",
                  transform: `scale(${pop}) rotate(${(1 - pop) * -8}deg)`,
                  opacity: pop > 0.05 ? 1 : 0,
                }}
              >
                {t.text.trim()}
              </span>
            </span>
          );
        })}
      </div>
    </Box>
  );
};

/** 06 Highlight keyword: the full line, with its key word on a highlighter mark. */
const HighlightKeyword: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const shown = useShownPage(plan);
  if (!shown) return null;
  const { highlight, ink } = colours(plan);
  const words = texts(shown.page);
  const key = keywordIndex(words);
  const sweep = Math.min(1, shown.age / 8);
  const size = fitSize(words, captionStyle(6).box.w, captionStyle(6).fontSize);
  return (
    <Box n={6}>
      <div style={{ fontFamily: CAPTION_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: "#FFFFFF", WebkitTextStroke: `9px ${ink}`, paintOrder: "stroke fill", textWrap: "balance" }}>
        {words.map((w, i) => (
          <span key={i}>
            {i > 0 ? " " : ""}
            {i === key ? (
              <span
                style={{
                  color: ink,
                  WebkitTextStroke: "0px",
                  padding: "0 10px",
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${highlight} ${sweep * 100}%, transparent ${sweep * 100}%)`,
                  boxDecorationBreak: "clone",
                }}
              >
                {w}
              </span>
            ) : (
              w
            )}
          </span>
        ))}
      </div>
    </Box>
  );
};

const RENDERERS: Record<number, React.FC<{ plan: VideoPlan }>> = { 1: Captions, 2: BoldCentre, 3: Typewriter, 4: LowerThird, 5: OutlinePop, 6: HighlightKeyword };

/** The video's captions in its caption style. */
export const CaptionsView: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  captionStyle(plan.captions);
  const Renderer = RENDERERS[plan.captions]!;
  return <Renderer plan={plan} />;
};
