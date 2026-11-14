import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, layout, leadInColours } from "./layout.js";
import { ball, cardFill, clay, FONT, useSquish } from "./shared.js";

/** One clay pill. Items get a numbered clay ball at the left. */
const Row: React.FC<{ text: string; box: Rect; delay: number; fill: string; ink: string; bullet?: { n: number; fill: string } }> = ({ text, box, delay, fill, ink, bullet }) => {
  const squish = useSquish(delay);
  const ballSize = Math.min(box.h - 24, 96);
  const left = bullet ? 30 + ballSize + 24 : 44;
  const size = fitFontSize(text, { w: box.w - left - 40, h: box.h - 24 }, bullet ? 62 : 74, 28);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        ...clay(fill, box.h / 2),
        transform: squish.transform,
        display: "flex",
        alignItems: "center",
        paddingLeft: left,
        paddingRight: 40,
        fontFamily: FONT,
        fontWeight: bullet ? 800 : 900,
        fontSize: size,
        lineHeight: 1.1,
        color: ink,
      }}
    >
      {bullet && (
        <div
          style={{
            position: "absolute",
            left: 30,
            top: (box.h - ballSize) / 2,
            width: ballSize,
            height: ballSize,
            ...ball(bullet.fill),
            boxShadow: "0 8px 14px rgba(40, 30, 60, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 900,
            fontSize: ballSize * 0.55,
          }}
        >
          {bullet.n}
        </div>
      )}
      {text}
    </div>
  );
};

/** A list: the lead-in on a highlight pill, then one pill per item, landing a few frames apart. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const ink = colour(palette, 4);
  return (
    <AbsoluteFill>
      {header && <Row text={header} box={boxes[0]!} delay={0} {...leadInColours(palette)} />}
      {items.map((item, i) => (
        <Row key={i} text={item} box={itemBoxes[i]!} delay={6 + i * 6} fill={cardFill(palette)} ink={ink} bullet={{ n: i + 1, fill: colour(palette, i % 2 === 0 ? 1 : 2) }} />
      ))}
    </AbsoluteFill>
  );
};
