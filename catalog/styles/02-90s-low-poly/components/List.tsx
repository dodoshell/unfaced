import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { tone } from "./colours.js";
import { BEVEL, colour, itemSize, layout, listRow, rowText } from "./layout.js";
import { pointer, Poly } from "./poly.js";
import { accentFill, arcadeText, menuText, panelFill, shadowInk, useSlide, Window } from "./shared.js";

const FIRST_ITEM = 6;
const STAGGER = 6;
const POINTER = pointer();

/** A raised square button with a classic two-tone bevel, holding the item's number. */
const Chip: React.FC<{ n: number; size: number; fill: string; ink: string }> = ({ n, size, fill, ink }) => {
  const edge = Math.max(5, Math.round(size / 12));
  return (
    <div
      style={{
        flex: "none",
        width: size,
        height: size,
        boxSizing: "border-box",
        border: `${edge}px solid`,
        borderColor: `${tone(fill, 0.45)} ${tone(fill, -0.45)} ${tone(fill, -0.45)} ${tone(fill, 0.45)}`,
        backgroundColor: fill,
        outline: `3px solid ${ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ ...arcadeText(Math.round(size * 0.42), ink, 3), paddingLeft: 4, paddingTop: 4 }}>{n}</span>
    </div>
  );
};

/** One menu row sliding in from the right. */
const Item: React.FC<{ n: number; text: string; box: Rect; size: number; palette: string[] }> = ({ n, text, box, size, palette }) => {
  const slide = useSlide(FIRST_ITEM + (n - 1) * STAGGER);
  const fill = panelFill(palette);
  const ink = shadowInk(palette);
  const { chip } = listRow(box);
  return (
    <Window
      box={box}
      border={colour(palette, 3)}
      fill={fill}
      ink={ink}
      bevel={BEVEL}
      cut={18}
      style={{ transform: `translateX(${(1 - slide) * 900}px)` }}
      contentStyle={{ gap: 22, padding: "0 24px 0 12px" }}
    >
      <Chip n={n} size={chip} fill={colour(palette, n % 2 === 1 ? 1 : 2)} ink={ink} />
      <div style={menuText(size, tone(fill[1], -0.6), 700)}>{rowText(text, box, size)}</div>
    </Window>
  );
};

/** A list as a game menu: the lead-in on an accent title bar, the items as menu rows, and a spinning cursor on the newest row. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const ink = shadowInk(palette);
  const drop = useSlide(0, 8);
  const headerBox = header ? boxes[0] : undefined;
  const fill = accentFill(palette);
  // Short lead-ins get the arcade face; longer ones fall back to the body face to stay big enough.
  const room = headerBox ? { w: headerBox.w - 2 * BEVEL - 60, h: headerBox.h - 2 * BEVEL - 16 } : { w: 0, h: 0 };
  const arcadeSize = fitFontSize(header, room, 44, 28, { charWidth: 1, lineHeight: 1.3 });
  const arcade = arcadeSize > 28;
  const bodySize = fitFontSize(header, room, 64, 32, { charWidth: 0.58, lineHeight: 1.1 });
  // One size for every row, as in a game menu: the size the longest row fits at.
  const size = itemSize(items, itemBoxes);
  // The cursor moves to each row as it lands.
  const shown = items.map((_, i) => FIRST_ITEM + i * STAGGER + 4).filter((t) => frame >= t).length;
  const centre = (i: number) => itemBoxes[i]!.y + itemBoxes[i]!.h / 2;
  const move = interpolate(frame - (FIRST_ITEM + (shown - 1) * STAGGER + 4), [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const pointerY = shown === 0 ? 0 : shown === 1 ? centre(0) : centre(shown - 2) + (centre(shown - 1) - centre(shown - 2)) * move;
  return (
    <AbsoluteFill>
      {headerBox && (
        <Window
          box={headerBox}
          border={colour(palette, 3)}
          fill={fill}
          ink={ink}
          bevel={BEVEL}
          cut={22}
          style={{ transform: `translateY(${(1 - drop) * -420}px)` }}
          contentStyle={{ justifyContent: "center", padding: "0 30px", textAlign: "center" }}
        >
          {arcade ? (
            <div style={{ ...arcadeText(arcadeSize, tone(fill[1], -0.6), 3), lineHeight: 1.3, paddingTop: 4 }}>{header}</div>
          ) : (
            <div style={menuText(bodySize, tone(fill[1], -0.6), 800)}>{header}</div>
          )}
        </Window>
      )}
      {items.map((text, i) => (
        <Item key={i} n={i + 1} text={text} box={itemBoxes[i]!} size={size} palette={palette} />
      ))}
      {shown > 0 && (
        <Poly
          mesh={POINTER}
          x={72 + Math.sin(frame / 4) * 5}
          y={pointerY}
          size={34}
          turns={[["x", frame * 0.12], ["y", -0.35]]}
          colours={[colour(palette, 3), tone(colour(palette, 3), -0.2)]}
          outline={{ width: 3, colour: ink }}
        />
      )}
    </AbsoluteFill>
  );
};
