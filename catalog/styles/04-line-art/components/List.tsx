import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { FONT, LINE, Pen, Sheet, useDraw, useSettle } from "./shared.js";

const STAGGER = 7;
const NUMBER_W = 116;
const ITEM_FIT = { charWidth: 0.56, lineHeight: 1.12 };
/** The room an item's words have in its row. */
const itemSpace = (box: Rect) => ({ w: box.w - NUMBER_W, h: box.h - 26 });

/** One item: its number in the accent colour, the words, and a rule drawn under it. */
const Row: React.FC<{ index: number; text: string; box: Rect; size: number; palette: string[] }> = ({ index, text, box, size, palette }) => {
  const delay = 6 + index * STAGGER;
  const rule = useDraw(delay, 20);
  const settle = useSettle(delay + 6);
  const y = box.y + box.h - LINE / 2;
  return (
    <>
      <Sheet>
        <Pen d={`M ${box.x} ${y} H ${box.x + box.w}`} p={rule} colour={colour(palette, 2)} />
      </Sheet>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h - LINE,
          display: "flex",
          alignItems: "center",
          fontFamily: FONT,
          ...settle,
        }}
      >
        <div style={{ flex: "none", width: NUMBER_W, fontWeight: 300, fontSize: Math.min(64, box.h * 0.5), color: colour(palette, 1), fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div style={{ fontWeight: 500, fontSize: size, lineHeight: 1.12, letterSpacing: "-0.01em", color: colour(palette, 4) }}>{text}</div>
      </div>
    </>
  );
};

/**
 * A list: the lead-in with a short accent underline, then the items one under another, each
 * on a ruled line drawn left to right. Every item takes the size of the one that fits smallest.
 */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const headerBox = header ? boxes[0] : undefined;
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const under = useDraw(4, 16);
  const settle = useSettle(0, 12);
  const size = Math.min(...items.map((text, i) => fitFontSize(text, itemSpace(itemBoxes[i]!), 60, 30, ITEM_FIT)));
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: fitFontSize(header, { w: headerBox.w, h: headerBox.h - 36 }, 66, 34, { charWidth: 0.56, lineHeight: 1.1 }),
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: colour(palette, 4),
              ...settle,
            }}
          >
            {header}
          </div>
          <svg width={110} height={LINE} style={{ marginTop: 20, overflow: "visible" }}>
            <Pen d={`M ${LINE / 2} ${LINE / 2} H ${110 - LINE / 2}`} p={under} colour={colour(palette, 1)} />
          </svg>
        </div>
      )}
      {items.map((text, i) => (
        <Row key={i} index={i} text={text} box={itemBoxes[i]!} size={size} palette={palette} />
      ))}
    </AbsoluteFill>
  );
};
