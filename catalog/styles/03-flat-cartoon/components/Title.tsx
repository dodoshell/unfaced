import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Scene } from "../../../../engine/src/plan/types.js";
import { colour, fitFontSize, INK, layout } from "./layout.js";
import { FONT, outlined, Starburst, usePop } from "./shared.js";

/** The hook: a white headline card tilted over a slowly turning starburst. */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  // Started a few frames early so the very first frame (the platforms' preview) already shows the hook.
  const pop = usePop(-6);
  const burstPop = usePop(-3);
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const size = fitFontSize(scene.text, { w: box.w - 2 * (INK + 40), h: box.h - 2 * (INK + 30) }, 104, 52);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return (
    <AbsoluteFill>
      <Starburst size={980} fill={colour(palette, 3)} ink={ink} rotate={frame * 0.25} style={{ left: cx - 490, top: cy - 490, scale: String(burstPop) }} />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          ...outlined(ink, "#FFFFFF", 48),
          transform: `rotate(-3deg) scale(${pop})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 40px",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.12,
          color: ink,
        }}
      >
        {scene.text}
      </div>
    </AbsoluteFill>
  );
};
