import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { cutCircle, FONT, lifted, nudge, nudged, onPaper, PaperImg, paperImage, Puppet, rosette, star, stepSpring, useStopMotion } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** Paper stars around the disc: offset from its centre, size, colour role, entrance delay. */
const STARS = [
  { dx: -250, dy: -170, size: 46, role: 3 as const, delay: 6 },
  { dx: 255, dy: -60, size: 34, role: 2 as const, delay: 9 },
  { dx: 215, dy: 215, size: 40, role: 3 as const, delay: 12 },
];

/**
 * A fact: its number cut from paper and glued on a coloured disc, over a rosette that turns
 * a notch on every exposure. The captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { step, t } = useStopMotion();
  const { fps } = useVideoConfig();
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType) ?? "★";
  const disc = colour(palette, 1);
  const R = box.w / 2;
  const cx = box.x + R;
  const cy = box.y + box.h / 2;
  const ring = R + 80;
  const images = useMemo(
    () => ({
      rosette: paperImage(2 * ring, 2 * ring, 40, [{ outline: rosette(ring, ring, ring, 18, 81 + n), fill: colour(palette, 3), shadow: lifted(10, 0.25) }], 81 + n),
      disc: paperImage(box.w, box.h, 40, [{ outline: cutCircle(R, box.h / 2, R - 4, 82 + n), fill: disc, shadow: lifted(16, 0.32) }], 82 + n),
      stars: STARS.map((s, i) => paperImage(2 * s.size, 2 * s.size, 14, [{ outline: star(s.size, s.size, s.size, 83 + i + n), fill: colour(palette, s.role), shadow: lifted(5, 0.3), grain: 0.5 }], 83 + i)),
    }),
    [palette, box.w, box.h, R, ring, n, disc],
  );
  const pop = stepSpring(t, fps);
  const bob = Math.sin(t / 11) * 10;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: cx - ring, top: cy - ring, width: 2 * ring, height: 2 * ring, transform: `scale(${pop}) rotate(${step * 2.5}deg)` }}>
        <PaperImg src={images.rosette} w={2 * ring} h={2 * ring} pad={40} />
      </div>
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: cx + s.dx - s.size,
            top: cy + s.dy - s.size + bob * 0.6,
            width: 2 * s.size,
            height: 2 * s.size,
            transform: nudged(nudge(92 + i, step, 2, 8), `scale(${stepSpring(t, fps, s.delay)})`),
          }}
        >
          <PaperImg src={images.stars[i]!} w={2 * s.size} h={2 * s.size} pad={14} />
        </div>
      ))}
      <div style={{ position: "absolute", left: box.x, top: box.y + bob, width: box.w, height: box.h, transform: nudged(nudge(91, step, 1.4, 0.8), `scale(${0.55 + 0.45 * pop})`) }}>
        <PaperImg src={images.disc} w={box.w} h={box.h} pad={40} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
            fontFamily: FONT,
            fontSize: label.length > 1 ? 210 : 290,
            lineHeight: 1,
            color: onPaper(disc, palette),
            // Patrick Hand has one weight; a stroke of its own colour makes the numeral a sturdier cut-out.
            WebkitTextStroke: `6px ${onPaper(disc, palette)}`,
            paintOrder: "stroke fill",
            transform: "rotate(-5deg)",
            textShadow: "3px 6px 6px rgba(30, 26, 20, 0.35)",
          }}
        >
          {label}
        </div>
      </div>
      {mascot && <Puppet rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
