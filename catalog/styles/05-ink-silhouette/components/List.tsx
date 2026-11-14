import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { CINZEL, CINZEL_WIDE, layout } from "./layout.js";
import { alpha, Hill, lettering, Ornament, roman, type Sky, sky, useFadeIn, useFadeOut } from "./shared.js";

const NUMERAL_W = 130;

/** One line of the list: a gold Roman numeral, the item in white, a faint rule underneath. */
const Row: React.FC<{ index: number; text: string; box: Rect; s: Sky; last: boolean; out: number }> = ({ index, text, box, s, last, out }) => {
  const t = useFadeIn(10 + index * 10, 22);
  const size = fitFontSize(text, { w: box.w - NUMERAL_W - 20, h: box.h - 16 }, 62, 30, CINZEL);
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
        opacity: t * out,
        transform: `translateY(${(1 - t) * 22}px)`,
        borderBottom: last ? undefined : `2px solid ${alpha(s.text, 0.22)}`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ ...lettering(s, Math.min(64, box.h * 0.5), 700), color: s.gold, width: NUMERAL_W, flex: "none", textAlign: "right", paddingRight: 30, boxSizing: "border-box" }}>
        {roman(String(index + 1))}
      </div>
      <div style={{ ...lettering(s, size, 600), lineHeight: 1.12 }}>{text}</div>
    </div>
  );
};

/** A list: the lead-in in gold small capitals over a rule, then the items fading in one by one, like a film's credits. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const s = sky(palette);
  const boxes = layout(scene, palette);
  const { header, items } = listParts(scene.text);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const head = useFadeIn(0, 18);
  const rule = useFadeIn(4, 36);
  const out = useFadeOut(scene);
  const headerBox = header ? boxes[0] : undefined;
  return (
    <AbsoluteFill>
      <Hill s={s} />
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
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            opacity: head * out,
          }}
        >
          <div style={{ ...lettering(s, fitFontSize(header, { w: headerBox.w - 40, h: headerBox.h - 44 }, 60, 32, CINZEL_WIDE), 700), color: s.gold, letterSpacing: "0.1em", textAlign: "center", lineHeight: CINZEL_WIDE.lineHeight }}>
            {header}
          </div>
          <Ornament width={300} colour={s.gold} t={rule} />
        </div>
      )}
      {items.map((text, i) => (
        <Row key={i} index={i} text={text} box={itemBoxes[i]!} s={s} last={i === items.length - 1} out={out} />
      ))}
    </AbsoluteFill>
  );
};
