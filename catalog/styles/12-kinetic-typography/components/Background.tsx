import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colour } from "./layout.js";
import { mix, paper } from "./shared.js";

/** Baselines every 96 px, like the grid of a type specimen. */
const BASELINES = Array.from({ length: 20 }, (_, i) => 48 + i * 96);

/**
 * A flat ground for the type: the background colour, a faint baseline grid with the column's
 * margins, and a progress bar along the top that fills as the video plays.
 */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = colour(palette, 0);
  const rule = mix(bg, paper(palette), 0.09);
  const progress = Math.min(1, (frame + 1) / durationInFrames);
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {BASELINES.map((y) => (
          <line key={y} x1={0} y1={y} x2={1080} y2={y} stroke={rule} strokeWidth={2} />
        ))}
        <line x1={60} y1={0} x2={60} y2={1920} stroke={rule} strokeWidth={2} />
        <line x1={940} y1={0} x2={940} y2={1920} stroke={rule} strokeWidth={2} />
        <rect x={0} y={0} width={1080 * progress} height={14} fill={colour(palette, 1)} />
      </svg>
    </AbsoluteFill>
  );
};
