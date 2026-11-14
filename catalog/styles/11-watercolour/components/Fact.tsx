import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Character, factBadge, factNumber, type Pose, polygonPath, type Scene, smoothPath, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { blob, handwriting, type Pt, rng, splatter, useDrift, useEase, WashImg, washImage } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

const PAD = 110;

/** A loose ring drawn in one go with a pen: it doesn't quite close and overshoots its start. */
function penRing(cx: number, cy: number, r: number, seed: number): string {
  const rand = rng(seed);
  const start = rand() * Math.PI * 2;
  const pts: Pt[] = Array.from({ length: 15 }, (_, i) => {
    const a = start + (i / 14) * Math.PI * 2.15;
    const k = r * (1 + (rand() - 0.5) * 0.05 + 0.03 * Math.sin(i * 0.8));
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.97];
  });
  return smoothPath(pts);
}

/** A five-pointed star drawn freehand with the same pen, for script types that don't number their beats. */
function penStar(cx: number, cy: number, r: number, seed: number): string {
  const rand = rng(seed);
  const pts: Pt[] = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2 + (rand() - 0.5) * 0.08;
    const k = (i % 2 === 0 ? r : r * 0.44) * (1 + (rand() - 0.5) * 0.1);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
  });
  return polygonPath(pts);
}

/**
 * A fact: its number handwritten in ink (or a star drawn freehand) on a round wash, with a
 * second colour bleeding into it, a loose pen ring and a spray of drops. The captions carry
 * the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const bloom = useEase(0, 30);
  const ink = useEase(8, 20);
  const drift = useDrift(12);
  const paint = useDrift(10, 45);
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const R = box.w / 2;
  const wash = useMemo(
    () =>
      washImage(
        box.w,
        box.h,
        PAD,
        [
          { d: blob(R, R, R - 10, R - 14, 31 + n, 0.07), colour: colour(palette, 1), strength: 0.5, wobble: 26, soft: 4 },
          { d: blob(R + 130, R + 120, 120, 100, 32 + n, 0.12), colour: colour(palette, 2), strength: 0.45, wobble: 20, soft: 3 },
        ],
        splatter(R, R, R + 10, R + 95, 14, [colour(palette, 1), colour(palette, 3)], 33 + n),
        30 + n,
      ),
    [box.w, box.h, R, n, palette],
  );
  return (
    <AbsoluteFill>
      {/* Not transformed itself: that would isolate the wash from the paper it glazes. */}
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }}>
        <WashImg src={wash} x={-PAD} y={-PAD} w={box.w + 2 * PAD} h={box.h + 2 * PAD} palette={palette} style={{ opacity: bloom, transform: `${paint} scale(${0.94 + 0.06 * bloom})` }} />
        <svg width={box.w} height={box.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ink, transform: drift }}>
          <path d={penRing(R, R, R - 18, 34 + n)} fill="none" stroke={colour(palette, 4)} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          {label === undefined && <path d={penStar(R, R + 8, R * 0.52, 35 + n)} fill="none" stroke={colour(palette, 4)} strokeWidth={9} strokeLinejoin="round" />}
        </svg>
        {label !== undefined && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 30,
              lineHeight: 1,
              opacity: ink,
              transform: drift,
              ...handwriting(label.length > 1 ? 230 : 300, colour(palette, 4)),
            }}
          >
            {label}
          </div>
        )}
      </div>
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
