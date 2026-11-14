import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colour } from "./layout.js";

/** Cream paper with two big flat shapes drifting slowly at the edges and a few floating dots. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 18;
  const dots = [
    { x: 120, y: 260, r: 16 },
    { x: 930, y: 640, r: 12 },
    { x: 170, y: 1040, r: 10 },
    { x: 965, y: 990, r: 18 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: colour(palette, 0), overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 820, height: 820, borderRadius: "50%", backgroundColor: colour(palette, 3), opacity: 0.55, left: 560 + drift, top: -380 }} />
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "42%", backgroundColor: colour(palette, 2), opacity: 0.35, left: -360, top: 1500 - drift, transform: `rotate(${frame / 6}deg)` }} />
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y + Math.sin((frame + i * 25) / 20) * 12,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: "50%",
            backgroundColor: colour(palette, i % 2 === 0 ? 1 : 2),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
