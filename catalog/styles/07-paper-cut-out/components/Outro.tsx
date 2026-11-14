import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { cardPaper, cutCircle, heart, lifted, nudge, nudged, PaperImg, paperImage, type Pt, Puppet, star, stepSpring, useStopMotion } from "./shared.js";

/** Bits of paper drifting down past the disc: start position, size, colour role, shape. */
const CONFETTI = [
  { x: 200, y: 360, size: 22, role: 1 as const, kind: "heart" },
  { x: 860, y: 420, size: 18, role: 3 as const, kind: "star" },
  { x: 250, y: 760, size: 16, role: 2 as const, kind: "dot" },
  { x: 840, y: 800, size: 24, role: 1 as const, kind: "heart" },
  { x: 170, y: 560, size: 18, role: 3 as const, kind: "star" },
  { x: 900, y: 610, size: 14, role: 2 as const, kind: "dot" },
];

/**
 * The ending: a paper heart glued on a white disc, beating in two exposures, over a ring of
 * paper rays that turns a notch per exposure, with paper confetti. The engine draws the
 * ending's sign above it.
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { step, t } = useStopMotion();
  const { fps } = useVideoConfig();
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const box = layout(scene, palette)[0]!;
  const R = box.w / 2;
  /** The outer radius of the ring of paper rays behind the disc. */
  const RAYS = R + 120;
  const images = useMemo(() => {
    const bit = (kind: string, s: number, seed: number): Pt[] => (kind === "heart" ? heart(s, s, s * 1.5, seed) : kind === "star" ? star(s, s, s, seed) : cutCircle(s, s, s * 0.7, seed, 0.05));
    const rays = Array.from({ length: 16 }, (_, i): Pt[] => {
      const a = (i / 16) * Math.PI * 2;
      const at = (r: number, da: number): Pt => [RAYS + Math.cos(a + da) * r, RAYS + Math.sin(a + da) * r];
      return [at(R - 20, -0.11), at(RAYS - 6, -0.035), at(RAYS - 2, 0.03), at(R - 20, 0.11)];
    });
    return {
      rays: paperImage(2 * RAYS, 2 * RAYS, 30, rays.map((outline, i) => ({ outline, fill: colour(palette, i % 2 === 0 ? 3 : 2), shadow: lifted(8, 0.26), grain: 0.7 })), 165),
      disc: paperImage(box.w, box.h, 40, [{ outline: cutCircle(R, R, R - 4, 160), fill: cardPaper(palette), shadow: lifted(16, 0.3) }], 160),
      heart: paperImage(240, 240, 30, [{ outline: heart(120, 122, 175, 161), fill: colour(palette, 1), shadow: lifted(9, 0.32) }], 161),
      confetti: CONFETTI.map((c, i) => paperImage(2 * c.size, 2 * c.size, 12, [{ outline: bit(c.kind, c.size, 170 + i), fill: colour(palette, c.role), shadow: lifted(4, 0.28), grain: 0 }], 170 + i)),
    };
  }, [palette, box.w, box.h, R, RAYS]);
  const pop = stepSpring(t, fps);
  const heartPop = stepSpring(t, fps, 5);
  // Two quick beats, then a rest: one held pose bigger, the next back down.
  const beat = step % 10 === 2 || step % 10 === 4 ? 1.1 : 1;
  return (
    <AbsoluteFill>
      {CONFETTI.map((c, i) => {
        const fall = (step * 9 + i * 140) % 420;
        return (
          <div key={i} style={{ position: "absolute", left: c.x - c.size, top: c.y - c.size + fall - 120, width: 2 * c.size, height: 2 * c.size, opacity: pop, transform: `rotate(${(step * 23 + i * 60) % 360}deg)` }}>
            <PaperImg src={images.confetti[i]!} w={2 * c.size} h={2 * c.size} pad={12} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: box.x + R - RAYS, top: box.y + R - RAYS, width: 2 * RAYS, height: 2 * RAYS, transform: `scale(${pop}) rotate(${step * 2}deg)` }}>
        <PaperImg src={images.rays} w={2 * RAYS} h={2 * RAYS} pad={30} />
      </div>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, transform: nudged(nudge(162, step, 1.4, 0.6), `scale(${0.55 + 0.45 * pop})`) }}>
        <PaperImg src={images.disc} w={box.w} h={box.h} pad={40} />
        <div style={{ position: "absolute", left: R - 120, top: R - 120, width: 240, height: 240, transform: nudged(nudge(163, step, 1, 1.2), `scale(${heartPop * beat}) rotate(-6deg)`) }}>
          <PaperImg src={images.heart} w={240} h={240} pad={30} />
        </div>
      </div>
      {mascot && <Puppet rig={mascot.rig} pose={endingPose(ending)} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
