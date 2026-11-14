import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { CINZEL, layout } from "./layout.js";
import { Hill, HILL_X, hillY, lettering, Ornament, sky, useFadeIn, useFadeOut } from "./shared.js";

/**
 * The hook in white serif capitals on the dusk sky, between two gold rules, over the hill.
 * The words are complete on the first frame (the platforms' preview); only the rules draw
 * themselves out slowly, and the whole block drifts up a few pixels.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const s = sky(palette);
  const box = layout(scene, palette)[0]!;
  const rules = useFadeIn(2, 40);
  const out = useFadeOut(scene);
  const drift = interpolate(frame, [0, 300], [0, -14], { extrapolateRight: "clamp" });
  const size = fitFontSize(scene.text, { w: box.w - 40, h: box.h - 150 }, 124, 50, CINZEL);
  return (
    <AbsoluteFill>
      <Hill s={s} />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          opacity: out,
          transform: `translateY(${drift}px)`,
        }}
      >
        <Ornament width={360} colour={s.gold} t={rules} />
        <div style={{ ...lettering(s, size), textAlign: "center", width: box.w - 40 }}>{scene.text}</div>
        <Ornament width={360} colour={s.gold} t={rules} />
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={HILL_X} y={hillY(HILL_X)} size={200} />}
    </AbsoluteFill>
  );
};
