import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { BANGERS, layout } from "./layout.js";
import { burstPath, FONT, type Inks, inks, lettering, MISREGISTER, Panel, useBoil, useSlam } from "./shared.js";

const STAGGER = 8;

/** One item: a white panel with the item in comic lettering and its number on a small burst over the panel's left edge. */
const Item: React.FC<{ index: number; text: string; box: Rect; c: Inks }> = ({ index, text, box, c }) => {
  const slam = useSlam(6 + index * STAGGER);
  const boil = useBoil();
  // The badge breaks out over the panel's left edge, but stays inside the item's box.
  const badge = Math.min(box.h, 116);
  const inset = badge * 0.42;
  const textLeft = badge + 16;
  const size = fitFontSize(text, { w: box.w - textLeft - 36, h: box.h - 22 }, 84, 34, BANGERS);
  const tilt = index % 2 === 0 ? -0.8 : 0.8;
  if (!slam.shown) return null;
  const r = badge / 2;
  const d = burstPath(r, r, r, r * 0.78, 9, index * 7 + 3 + boil * 0.37);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, transform: `translateX(${slam.shake}px) scale(${slam.scale}) rotate(${tilt}deg)` }}>
      <Panel x={inset} y={0} w={box.w - inset} h={box.h} fill={c.balloon} line={c.line} />
      <div style={{ position: "absolute", left: textLeft, right: 30, top: 0, bottom: 0, display: "flex", alignItems: "center", ...lettering(c.line, size) }}>{text}</div>
      <svg width={badge} height={badge} style={{ position: "absolute", left: 0, top: box.h / 2 - r, overflow: "visible" }}>
        <path d={d} fill={index % 2 === 0 ? c.accent : c.secondary} transform={`translate(${MISREGISTER.x * 0.6} ${MISREGISTER.y * 0.6})`} />
        <path d={d} fill="none" stroke={c.line} strokeWidth={5} strokeLinejoin="round" />
        <text x={r} y={r + badge * 0.2} textAnchor="middle" fontFamily={FONT} fontSize={badge * 0.56} fill={c.balloon} stroke={c.line} strokeWidth={4} paintOrder="stroke">
          {index + 1}
        </text>
      </svg>
    </div>
  );
};

/** A list: the lead-in on a yellow caption box, then one panel per item slamming in one after another, with gutters between. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const c = inks(palette);
  const slam = useSlam();
  const boxes = layout(scene, palette);
  const { header, items } = listParts(scene.text);
  const headerBox = header ? boxes[0] : undefined;
  const itemBoxes = header ? boxes.slice(1) : boxes;
  return (
    <AbsoluteFill>
      {headerBox && slam.shown && (
        <Panel
          x={headerBox.x}
          y={headerBox.y}
          w={headerBox.w}
          h={headerBox.h}
          fill={c.highlight}
          line={c.line}
          rotate={-1.5}
          style={{ translate: `${slam.shake}px 0`, scale: String(slam.scale) }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 36px",
              textAlign: "center",
              ...lettering(c.line, fitFontSize(header, { w: headerBox.w - 72, h: headerBox.h - 26 }, 76, 38, BANGERS)),
            }}
          >
            {header}
          </div>
        </Panel>
      )}
      {items.map((text, i) => (
        <Item key={i} index={i} text={text} box={itemBoxes[i]!} c={c} />
      ))}
    </AbsoluteFill>
  );
};
