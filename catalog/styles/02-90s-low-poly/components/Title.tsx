import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { tone } from "./colours.js";
import { colour, layout } from "./layout.js";
import { gem, Poly } from "./poly.js";
import { menuText, panelFill, shadowInk, Window } from "./shared.js";

const GEM = gem();
const BEVEL = 18;

/** The hook on a bevelled menu window that hangs in 3D space, swaying a little, with a gem spinning on its corner. */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const fill = panelFill(palette);
  const ink = shadowInk(palette);
  const size = fitFontSize(scene.text, { w: box.w - 2 * (BEVEL + 36), h: box.h - 2 * (BEVEL + 32) }, 104, 50, { charWidth: 0.6, lineHeight: 1.12 });
  // Complete and nearly square to the camera on frame 0 (the platforms' preview), then a slow sway.
  const sway = `perspective(1400px) rotateY(${Math.sin(frame / 48) * 5}deg) rotateX(${Math.sin(frame / 63) * 3}deg)`;
  return (
    <AbsoluteFill>
      <Window box={box} border={colour(palette, 3)} fill={fill} ink={ink} bevel={BEVEL} cut={30} style={{ transform: sway }} contentStyle={{ justifyContent: "center", padding: "32px 36px", textAlign: "center" }}>
        <div style={menuText(size, tone(fill[1], -0.6))}>{scene.text}</div>
      </Window>
      <Poly
        mesh={GEM}
        x={box.x + 34}
        y={box.y + 22 + Math.sin(frame / 14) * 6}
        size={58}
        turns={[["y", frame * 0.06], ["x", -0.5]]}
        colours={[colour(palette, 1), tone(colour(palette, 1), -0.15)]}
        outline={{ width: 3, colour: ink }}
      />
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
