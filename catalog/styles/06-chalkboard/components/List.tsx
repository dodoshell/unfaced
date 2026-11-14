import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { chalk } from "./colours.js";
import { layout } from "./layout.js";
import { boiled, Chalk, dusty, FONT, grain, type Pt, trembleOf, useBoil, useDraw, useWrite } from "./shared.js";

const STAGGER = 10;
const NUMBER_W = 96;
const ITEM_FIT = { charWidth: 0.42, lineHeight: 1.05 };
/** The room an item's words have in its row. */
const itemSpace = (box: Rect) => ({ w: box.w - NUMBER_W, h: box.h - 16 });

/** A hand-drawn wavy line from x0 to x1 at y. */
const wave = (x0: number, x1: number, y: number): Pt[] => Array.from({ length: 17 }, (_, i) => [x0 + ((x1 - x0) * i) / 16, y + Math.sin(i * 1.15) * 7] as Pt);

/** One item, written on from left to right: its number in accent chalk, then the words. */
const Row: React.FC<{ index: number; text: string; box: Rect; size: number; palette: string[] }> = ({ index, text, box, size, palette }) => {
  const boil = useBoil();
  const write = useWrite(8 + index * STAGGER, 14);
  const ink = chalk(palette, 4);
  const accent = chalk(palette, 1);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", alignItems: "center", fontFamily: FONT, ...write }}>
      <div style={{ flex: "none", width: NUMBER_W, fontWeight: 700, fontSize: Math.min(84, box.h * 0.7), color: accent, ...dusty(accent), transform: trembleOf(boil, 60 + index, -3) }}>{index + 1}.</div>
      <div style={{ fontWeight: 600, fontSize: size, lineHeight: ITEM_FIT.lineHeight, color: ink, ...dusty(ink), transform: trembleOf(boil, 70 + index) }}>{text}</div>
    </div>
  );
};

/**
 * A list, as written on the board: the lead-in with a wavy accent underline, then the items
 * one by one, each numbered. Every item takes the size of the one that fits smallest.
 */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const boil = useBoil();
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const headerBox = header ? boxes[0] : undefined;
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const size = Math.min(...items.map((text, i) => fitFontSize(text, itemSpace(itemBoxes[i]!), 96, 40, ITEM_FIT)));
  const ink = chalk(palette, 4);
  const write = useWrite(0, 14);
  const under = useDraw(10, 16);
  return (
    <AbsoluteFill style={grain}>
      {headerBox && (
        <div style={{ position: "absolute", left: headerBox.x, top: headerBox.y, width: headerBox.w, height: headerBox.h, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: fitFontSize(header, { w: headerBox.w, h: headerBox.h - 40 }, 92, 44, { charWidth: 0.44, lineHeight: 1.0 }),
              lineHeight: 1.0,
              color: ink,
              ...dusty(ink),
              ...write,
              transform: trembleOf(boil, 50, -1.5),
            }}
          >
            {header}
          </div>
          <svg width={260} height={24} style={{ marginTop: 6, overflow: "visible" }}>
            <Chalk points={boiled(wave(4, 256, 12), 51, boil, 1.2)} p={under} colour={chalk(palette, 1)} seed={51} boil={boil} />
          </svg>
        </div>
      )}
      {items.map((text, i) => (
        <Row key={i} index={i} text={text} box={itemBoxes[i]!} size={size} palette={palette} />
      ))}
    </AbsoluteFill>
  );
};
