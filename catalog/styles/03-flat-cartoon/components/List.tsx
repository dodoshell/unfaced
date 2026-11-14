import { AbsoluteFill } from "remotion";
import type { Scene } from "../../../../engine/src/plan/types.js";
import { colour, fitFontSize, INK, layout, listParts } from "./layout.js";
import { FONT, outlined, strokedText, usePop } from "./shared.js";

const ITEM_STAGGER = 6;

const Item: React.FC<{ index: number; text: string; box: { x: number; y: number; w: number; h: number }; palette: string[] }> = ({ index, text, box, palette }) => {
  const pop = usePop(6 + index * ITEM_STAGGER);
  const ink = colour(palette, 4);
  const bullet = box.h - 2 * INK - 24;
  const textBox = { w: box.w - bullet - 2 * INK - 72, h: box.h - 2 * INK - 16 };
  const size = fitFontSize(text, textBox, 64, 30);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        ...outlined(ink, "#FFFFFF", box.h / 2),
        transform: `translateX(${(1 - pop) * -120}px)`,
        opacity: Math.min(1, pop * 1.5),
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 32px 0 12px",
      }}
    >
      <div
        style={{
          flex: "none",
          width: bullet,
          height: bullet,
          borderRadius: "50%",
          backgroundColor: colour(palette, index % 2 === 0 ? 1 : 2),
          border: `${INK - 2}px solid ${ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <span style={{ ...strokedText(ink, Math.round(bullet * 0.55)), marginTop: 4 }}>{index + 1}</span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.1, color: ink }}>{text}</div>
    </div>
  );
};

/** A list: a header tag, then one rounded pill per item sliding in one after another. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const pop = usePop();
  const boxes = layout(scene, palette);
  const { header, items } = listParts(scene.text);
  const ink = colour(palette, 4);
  const headerBox = header ? boxes[0] : undefined;
  const itemBoxes = header ? boxes.slice(1) : boxes;
  return (
    <AbsoluteFill>
      {headerBox && (
        <div
          style={{
            position: "absolute",
            left: headerBox.x,
            top: headerBox.y,
            width: headerBox.w,
            height: headerBox.h,
            ...outlined(ink, colour(palette, 3), 28),
            transform: `rotate(-2deg) scale(${pop})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: fitFontSize(header, { w: headerBox.w - 80, h: headerBox.h - 30 }, 72, 36),
            lineHeight: 1.05,
            color: ink,
          }}
        >
          {header}
        </div>
      )}
      {items.map((text, i) => (
        <Item key={i} index={i} text={text} box={itemBoxes[i]!} palette={palette} />
      ))}
    </AbsoluteFill>
  );
};
