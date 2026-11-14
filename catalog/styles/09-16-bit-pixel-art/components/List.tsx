import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, ITEM_FIT, itemSize, layout, listRow, rowText } from "./layout.js";
import { brightness, CELL, snap, tone } from "./pixels.js";
import { Bitmap, BORDER, boxColours, outlineInk, PixelBox, pixelText, STEP, steppedRect, useStepFrame } from "./shared.js";

const FIRST_ITEM = 6;
const STAGGER = 9;
/** Letters typed per frame once a row is in. */
const TYPE_RATE = 1.6;
/** How far a sliding row still is from home at each step: three steps, then in place. */
const SLIDE = [1, 0.5, 0.18];

const CURSOR = ["x......", "xx.....", "xox....", "xoox...", "xooox..", "xoox...", "xox....", "xx.....", "x......"];

/** Dark lettering on light fills, white on dark ones. */
const textOn = (fill: string, ink: string, light = 0.55) => (brightness(fill) > light ? ink : "#FFFFFF");

/** A row's number. In a small button the drop shadow would fill the font's counters and turn a 2 into an 8, so it goes, and the number takes the plainer contrast of the two inks. */
const number = (chip: number, fill: string, ink: string): React.CSSProperties =>
  chip < 60 ? { ...pixelText(Math.round(chip * 0.62), textOn(fill, ink), ink, 700), textShadow: "none" } : pixelText(Math.round(chip * 0.62), textOn(fill, ink, 0.78), ink, 700);

/** A numbered row that slides in from the left in whole-pixel steps, then types its text out. */
const Item: React.FC<{ n: number; text: string; box: Rect; size: number; palette: string[]; frame: number }> = ({ n, text, box, size, palette, frame }) => {
  const start = FIRST_ITEM + (n - 1) * STAGGER;
  const k = Math.floor((frame - start) / STEP);
  if (k < 0) return null;
  const away = SLIDE[k] ?? 0;
  const ink = outlineInk(palette);
  const { fill, text: lettering, shadow } = boxColours(palette);
  const { chip } = listRow(box);
  const shown = rowText(text, box, size);
  const chipFill = colour(palette, n % 2 === 1 ? 1 : 2);
  const typed = Math.max(0, Math.floor((frame - start - 2 * STEP) * TYPE_RATE));
  return (
    <PixelBox box={box} fill={fill} border={colour(palette, 2)} ink={ink} style={{ transform: `translateX(${snap(-away * 900)}px)` }} contentStyle={{ gap: 24, padding: `0 ${CELL * 3}px 0 ${CELL * 2}px` }}>
      <div style={{ position: "relative", flex: "none", width: chip, height: chip }}>
        <svg width={chip} height={chip} shapeRendering="crispEdges" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={steppedRect(0, 0, chip, chip, 1)} fill={ink} />
          <path d={steppedRect(CELL, CELL, chip - 2 * CELL, chip - 2 * CELL, 0)} fill={chipFill} />
          <rect x={CELL} y={CELL} width={chip - 2 * CELL} height={CELL} fill={tone(chipFill, 0.35)} />
          <rect x={CELL} y={chip - 2 * CELL} width={chip - 2 * CELL} height={CELL} fill={tone(chipFill, -0.3)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...number(chip, chipFill, ink) }}>{n}</div>
      </div>
      {/* The whole text is laid out from the start, so typing never re-wraps it; untyped letters are just hidden. */}
      <div style={pixelText(size, lettering, shadow, 600)}>
        {shown.slice(0, typed)}
        <span style={{ color: "transparent", textShadow: "none" }}>{shown.slice(typed)}</span>
      </div>
    </PixelBox>
  );
};

/** A list as an RPG menu: the lead-in on a highlight box, one numbered row per item, a cursor on the newest row. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useStepFrame();
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const headerBox = header ? boxes[0] : undefined;
  const ink = outlineInk(palette);
  const headFill = colour(palette, 3);
  const shown = items.filter((_, i) => frame >= FIRST_ITEM + i * STAGGER + 2 * STEP).length;
  const target = itemBoxes[shown - 1];
  // One size for every row, as in a game menu: the size the longest row fits at.
  const size = itemSize(items, itemBoxes);
  return (
    <AbsoluteFill>
      {headerBox && (
        <PixelBox box={headerBox} fill={headFill} border={colour(palette, 1)} ink={ink} contentStyle={{ justifyContent: "center", padding: "0 30px", textAlign: "center" }}>
          <div style={pixelText(fitFontSize(header, { w: headerBox.w - 2 * BORDER - 60, h: headerBox.h - 2 * BORDER - 4 }, 64, 30, ITEM_FIT), textOn(headFill, ink), tone(headFill, -0.3), 700)}>
            {header}
          </div>
        </PixelBox>
      )}
      {items.map((text, i) => (
        <Item key={i} n={i + 1} text={text} box={itemBoxes[i]!} size={size} palette={palette} frame={frame} />
      ))}
      {target && <Bitmap rows={CURSOR} colours={{ x: ink, o: "#FFFFFF" }} x={60 - (Math.floor(frame / 9) % 2) * CELL} y={snap(target.y + target.h / 2) - 4 * CELL} />}
    </AbsoluteFill>
  );
};
