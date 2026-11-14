import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { EndingMarkKind } from "./endings.js";
import type { Rect } from "./safeZone.js";

export interface EndingMarkProps {
  kind: EndingMarkKind;
  /** Where to draw: the sign is square, centred in the box at the box's shorter side. */
  box: Rect;
  fill: string;
  ink: string;
}

const OUTLINE = 8;
const GLYPH_FONT = "Fredoka, 'Arial Rounded MT Bold', sans-serif";

const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Colours for the sign from a page palette: its darkest colour as ink, its accent (second colour) as fill. */
export function markColours(palette: string[]): { fill: string; ink: string } {
  const valid = palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  const ink = [...valid].sort((a, b) => luminance(a) - luminance(b))[0] ?? "#1B1B3A";
  const fill = valid.find((c, i) => i >= 1 && c !== ink) ?? valid.find((c) => c !== ink) ?? "#FFD23F";
  return { fill, ink };
}

/**
 * The wordless sign of an ending (see endings.ts), popping in when its Sequence starts:
 * an arrow with dots that run on (cliffhanger), a question bubble (comment question), a
 * follow button with a 2 (part 2), an arrow turning back (callback to the hook). The engine
 * draws it unless the style does (drawsEndingMark); in such a style, a video's own ending scene
 * that skips StyleScene draws it itself.
 */
export const EndingMark: React.FC<EndingMarkProps> = ({ kind, box, fill, ink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const size = Math.min(box.w, box.h);
  const stroke = { stroke: ink, strokeWidth: OUTLINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  let body: React.ReactNode;
  let transform = `scale(${pop})`;

  if (kind === "continued") {
    const dots = Math.floor(frame / 7) % 4;
    transform = `translateX(${(1 - pop) * -size * 0.6}px)`;
    body = (
      <>
        <polygon points="14,62 118,62 118,24 188,100 118,176 118,138 14,138" fill={fill} {...stroke} />
        {[48, 80, 112].map((x, i) => (
          <circle key={x} cx={x} cy={100} r={11} fill={ink} opacity={i < dots ? 1 : 0.18} />
        ))}
      </>
    );
  } else if (kind === "comment") {
    transform = `scale(${pop}) translateY(${Math.sin(frame / 7) * 5}px)`;
    body = (
      <>
        <path d="M54,22 H146 A34,34 0 0 1 180,56 V112 A34,34 0 0 1 146,146 H104 L58,184 L66,146 H54 A34,34 0 0 1 20,112 V56 A34,34 0 0 1 54,22 Z" fill={fill} {...stroke} />
        <text x={100} y={122} textAnchor="middle" fontFamily={GLYPH_FONT} fontWeight={700} fontSize={104} fill={ink}>
          ?
        </text>
      </>
    );
  } else if (kind === "follow") {
    const beat = 1 + 0.08 * Math.max(0, Math.sin(frame / 5));
    body = (
      <>
        <circle cx={92} cy={92} r={76} fill={fill} {...stroke} />
        <text x={92} y={130} textAnchor="middle" fontFamily={GLYPH_FONT} fontWeight={700} fontSize={112} fill={ink}>
          2
        </text>
        <g transform={`translate(156 156) scale(${beat})`}>
          <circle r={34} fill={ink} />
          <path d="M-16,0 H16 M0,-16 V16" stroke={fill} strokeWidth={9} strokeLinecap="round" />
        </g>
      </>
    );
  } else {
    // An arrow turning back on itself (counter-clockwise), spinning in.
    transform = `scale(${pop}) rotate(${(1 - pop) * -200}deg)`;
    const arc = "M139.85,52.51 A62,62 0 1 0 158.26,121.21";
    body = (
      <>
        <path d={arc} fill="none" stroke={ink} strokeWidth={42} strokeLinecap="round" />
        <path d={arc} fill="none" stroke={fill} strokeWidth={26} strokeLinecap="round" />
        <polygon points="171,84 186,134 131,116" fill={fill} {...stroke} />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ position: "absolute", left: box.x + (box.w - size) / 2, top: box.y + (box.h - size) / 2, overflow: "visible", transform, transformOrigin: "center" }}
    >
      {body}
    </svg>
  );
};
