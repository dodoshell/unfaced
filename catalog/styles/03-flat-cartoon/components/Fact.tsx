import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Scene } from "../../../../engine/src/plan/types.js";
import { colour, factNumber, layout } from "./layout.js";
import { outlined, Sparkle, strokedText, useBob, usePop } from "./shared.js";

/** A fact: a big numbered badge that pops in and bobs, with twinkling sparkles. */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const pop = usePop();
  const bob = useBob(14);
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const n = factNumber(scene);
  const twinkle = (offset: number) => 0.75 + 0.25 * Math.sin((frame + offset) / 7);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + bob,
          width: box.w,
          height: box.h,
          ...outlined(ink, colour(palette, 1), "50%"),
          transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...strokedText(ink, n > 9 ? 200 : 280), marginTop: 20 }}>{n}</div>
      </div>
      <Sparkle x={box.x - 20} y={box.y + 60} size={110} fill={colour(palette, 3)} ink={ink} scale={pop * twinkle(0)} />
      <Sparkle x={box.x + box.w + 30} y={box.y + 140} size={80} fill={colour(palette, 2)} ink={ink} scale={pop * twinkle(10)} />
      <Sparkle x={box.x + box.w - 10} y={box.y + box.h + 20} size={120} fill={colour(palette, 3)} ink={ink} scale={pop * twinkle(20)} />
    </AbsoluteFill>
  );
};
