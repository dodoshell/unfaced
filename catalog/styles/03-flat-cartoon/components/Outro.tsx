import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, useMascot } from "../../../../engine/remotion/kit/index.js";
import type { Scene } from "../../../../engine/src/plan/types.js";
import { colour, layout } from "./layout.js";
import { outlined, Starburst, strokedText, useBob, usePop } from "./shared.js";

/** The ending: an exclamation badge bursting out of a spinning starburst, with confetti. */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const pop = usePop();
  const bob = useBob(10, 50);
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const confetti = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + 0.3;
    const dist = 330 + (i % 3) * 60;
    return { x: cx + Math.cos(angle) * dist * pop, y: cy + Math.sin(angle) * dist * pop + (frame % 60) * 0.6, role: ((i % 3) + 1) as 1 | 2 | 3, rot: frame * 4 + i * 40 };
  });
  return (
    <AbsoluteFill>
      <Starburst size={820} points={18} fill={colour(palette, 1)} ink={ink} rotate={-frame * 0.4} style={{ left: cx - 410, top: cy - 410, scale: String(pop) }} />
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: c.x - 18, top: c.y - 9, width: 36, height: 18, borderRadius: 6, backgroundColor: colour(palette, c.role), border: `4px solid ${ink}`, transform: `rotate(${c.rot}deg)`, opacity: pop }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y + bob,
          width: box.w,
          height: box.h,
          ...outlined(ink, colour(palette, 3), "50%"),
          transform: `scale(${pop})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...strokedText(ink, 300), marginTop: 24 }}>!</div>
      </div>
      {mascot && <Character rig={mascot.rig} pose="happy" x={540} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
