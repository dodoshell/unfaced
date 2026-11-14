import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { FONT, useEnter } from "./shared.js";

const Row: React.FC<{ text: string; box: Rect; delay: number; fill: string; ink: string; bold?: boolean }> = ({ text, box, delay, fill, ink, bold }) => {
  const enter = useEnter(delay);
  const size = fitFontSize(text, { w: box.w - 60, h: box.h - 20 }, bold ? 72 : 60, 28);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        display: "flex",
        alignItems: "center",
        padding: "0 30px",
        boxSizing: "border-box",
        borderRadius: 24,
        backgroundColor: fill,
        color: ink,
        fontFamily: FONT,
        fontWeight: bold ? 700 : 600,
        fontSize: size,
        opacity: enter,
        transform: `translateX(${(1 - enter) * -80}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** A list: the lead-in, then one row per item, each sliding in a few frames after the last. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  return (
    <AbsoluteFill>
      {header && <Row text={header} box={boxes[0]!} delay={0} fill={colour(palette, 3)} ink={colour(palette, 4)} bold />}
      {items.map((item, i) => (
        <Row key={i} text={item} box={itemBoxes[i]!} delay={6 + i * 6} fill="#FFFFFF" ink={colour(palette, 4)} />
      ))}
    </AbsoluteFill>
  );
};
