import { AbsoluteFill, Freeze } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { CELL } from "./pixels.js";
import { Bitmap, BORDER, boxColours, outlineInk, PixelBox, pixelText, Twinkle, useStepFrame } from "./shared.js";

/** The "more text" arrow of an RPG text box. */
const NEXT = ["xxxxxxx", "xooooox", ".xooox.", "..xox..", "...x..."];

/** The hook in an RPG text box, complete on the first frame, with the box's next-page arrow blinking. */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useStepFrame();
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const ink = outlineInk(palette);
  const { fill, text, shadow } = boxColours(palette);
  const size = fitFontSize(scene.text, { w: box.w - 2 * BORDER - 60, h: box.h - 2 * BORDER - 48 }, 100, 48, { charWidth: 0.56, lineHeight: 1.1 });
  const arrowOn = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill>
      <PixelBox box={box} fill={fill} border={colour(palette, 1)} ink={ink} contentStyle={{ justifyContent: "center", padding: "24px 30px", textAlign: "center" }}>
        <div style={pixelText(size, text, shadow, 700)}>{scene.text}</div>
      </PixelBox>
      {arrowOn && <Bitmap rows={NEXT} colours={{ x: ink, o: colour(palette, 1) }} x={box.x + box.w - BORDER - 9 * CELL} y={box.y + box.h - BORDER - 7 * CELL} />}
      <Twinkle x={box.x + 30} y={box.y - 54} colour={colour(palette, 3)} phase={0} cell={CELL * 2} />
      <Twinkle x={box.x + box.w - 6} y={box.y - 30} colour={colour(palette, 3)} phase={9} />
      <Twinkle x={box.x - 24} y={box.y + box.h - 60} colour={colour(palette, 3)} phase={17} />
      {mascot && (
        // The mascot animates at the style's 10 fps, like a sprite.
        <Freeze frame={frame}>
          <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />
        </Freeze>
      )}
    </AbsoluteFill>
  );
};
