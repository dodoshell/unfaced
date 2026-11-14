import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { cardImage, cardPaper, CHAR_WIDTH, cutCircle, FONT, lifted, nudge, nudged, onPaper, PaperImg, paperImage, stepSpring, tapeImage, tornStrip, useStopMotion } from "./shared.js";

const ITEM_DELAY = 6;
const ITEM_STAGGER = 6;

/** One white strip with a coloured paper disc holding its number, slid in from the left in a few exposures. */
const Item: React.FC<{ index: number; text: string; box: Rect; palette: string[] }> = ({ index, text, box, palette }) => {
  const { step, t } = useStopMotion();
  const { fps } = useVideoConfig();
  const pop = stepSpring(t, fps, ITEM_DELAY + index * ITEM_STAGGER);
  const discFill = colour(palette, index % 2 === 0 ? 1 : 2);
  const disc = Math.min(box.h - 30, 92);
  const images = useMemo(
    () => ({
      strip: cardImage(box.w, box.h, cardPaper(palette), 120 + index, 10),
      disc: paperImage(disc, disc, 14, [{ outline: cutCircle(disc / 2, disc / 2, disc / 2 - 2, 130 + index, 0.04), fill: discFill, shadow: lifted(5, 0.3), grain: 0.6 }], 130 + index),
    }),
    [box.w, box.h, palette, index, disc, discFill],
  );
  const left = 34 + disc + 26;
  const size = fitFontSize(text, { w: box.w - left - 40, h: box.h - 26 }, 62, 30, { charWidth: CHAR_WIDTH, lineHeight: 1.05 });
  const tilt = index % 2 === 0 ? -0.8 : 0.9;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        transform: nudged(nudge(140 + index, step, 1.2, 0.3), `translateX(${(1 - pop) * -(box.x + box.w + 80)}px) rotate(${tilt}deg)`),
      }}
    >
      <PaperImg src={images.strip} w={box.w} h={box.h} pad={40} />
      <div style={{ position: "absolute", left: 34, top: (box.h - disc) / 2, width: disc, height: disc, transform: `rotate(${index * 23}deg)` }}>
        <PaperImg src={images.disc} w={disc} h={disc} pad={14} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 34,
          top: (box.h - disc) / 2,
          width: disc,
          height: disc,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 4,
          fontFamily: FONT,
          fontSize: disc * 0.62,
          lineHeight: 1,
          color: onPaper(discFill, palette),
          textShadow: "1px 2px 2px rgba(30, 26, 20, 0.3)",
        }}
      >
        {index + 1}
      </div>
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          right: 40,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          fontFamily: FONT,
          fontSize: size,
          lineHeight: 1.05,
          color: colour(palette, 4),
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** A list: the lead-in on a torn strip of coloured paper taped down, then one white strip per item. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { step, t } = useStopMotion();
  const { fps } = useVideoConfig();
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const head = header ? boxes[0]! : undefined;
  const stripFill = colour(palette, 3);
  const [hw, hh] = [head?.w ?? 0, head?.h ?? 0];
  const images = useMemo(() => {
    const strip = tornStrip(hw, hh, 150);
    return { strip: paperImage(hw, hh, 40, [{ outline: strip.outline, rim: strip.rim, fill: stripFill, shadow: lifted(12, 0.3) }], 150), tape: tapeImage(150, 50, 151) };
  }, [hw, hh, stripFill]);
  const drop = stepSpring(t, fps);
  return (
    <AbsoluteFill>
      {head && (
        <div style={{ position: "absolute", left: head.x, top: head.y, width: head.w, height: head.h, transform: nudged(nudge(152, step, 1.2, 0.3), `translateY(${(1 - drop) * -160}px) rotate(-1.6deg)`) }}>
          <PaperImg src={images.strip} w={head.w} h={head.h} pad={40} />
          <div
            style={{
              position: "absolute",
              inset: "0 44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: FONT,
              fontSize: fitFontSize(header, { w: head.w - 88, h: head.h - 34 }, 84, 40, { charWidth: CHAR_WIDTH, lineHeight: 1.02 }),
              lineHeight: 1.02,
              color: onPaper(stripFill, palette),
            }}
          >
            {header}
          </div>
          <div style={{ position: "absolute", left: head.w / 2 - 75, top: -30, transform: "rotate(-4deg)" }}>
            <PaperImg src={images.tape} w={150} h={50} pad={12} />
          </div>
        </div>
      )}
      {items.map((text, i) => (
        <Item key={i} index={i} text={text} box={itemBoxes[i]!} palette={palette} />
      ))}
    </AbsoluteFill>
  );
};
