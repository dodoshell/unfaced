import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, inkColour, layout } from "./layout.js";
import { blob, CHAR_WIDTH, handwriting, stroke, useDrift, useEase, WashImg, washImage } from "./shared.js";

const PAD = 40;
const ITEM_DELAY = 8;
const ITEM_STAGGER = 8;
/** How far each row wanders once it is painted, in pixels; every row on its own beat. */
const DRIFT = 12;

/** A brush stroke across a box, painted in from the left. */
const Stroke: React.FC<{ box: Rect; tint: string; strength: number; seed: number; reveal: number; drift: string; palette: string[] }> = ({ box, tint, strength, seed, reveal, drift, palette }) => {
  const src = useMemo(() => washImage(box.w, box.h, PAD, [{ d: stroke(20, box.w - 30, box.h / 2, box.h * 0.78, seed), colour: tint, strength, wobble: 14, soft: 3 }], [], seed), [box.w, box.h, tint, strength, seed]);
  const hidden = (1 - reveal) * 100;
  return <WashImg src={src} x={box.x - PAD} y={box.y - PAD} w={box.w + 2 * PAD} h={box.h + 2 * PAD} palette={palette} style={{ clipPath: `inset(0 ${hidden.toFixed(1)}% 0 0)`, transform: drift }} />;
};

/** One item: a faint stroke behind it and a round wash holding its number, then the words in ink. */
const Item: React.FC<{ index: number; text: string; box: Rect; palette: string[] }> = ({ index, text, box, palette }) => {
  const delay = ITEM_DELAY + index * ITEM_STAGGER;
  const paint = useEase(delay, 16);
  const drift = useDrift(DRIFT, 12 * (index + 1));
  const words = useEase(delay + 6, 16);
  const tint = colour(palette, index % 2 === 0 ? 1 : 2);
  const dot = Math.min(box.h - 20, 100);
  const dotSrc = useMemo(() => washImage(dot, dot, 30, [{ d: blob(dot / 2, dot / 2, dot / 2 - 4, dot / 2 - 6, 50 + index, 0.08), colour: tint, strength: 0.55, wobble: 10, soft: 2 }], [], 50 + index), [dot, tint, index]);
  const left = 24 + dot + 28;
  const size = fitFontSize(text, { w: box.w - left - 30, h: box.h - 16 }, 66, 30, { charWidth: CHAR_WIDTH, lineHeight: 1.05 });
  const ink = inkColour(palette);
  return (
    <>
      <Stroke box={box} tint={tint} strength={0.16} seed={60 + index} reveal={paint} drift={drift} palette={palette} />
      <WashImg src={dotSrc} x={box.x + 24 - 30} y={box.y + (box.h - dot) / 2 - 30} w={dot + 60} h={dot + 60} palette={palette} style={{ opacity: paint, transform: `${drift} scale(${0.9 + 0.1 * paint})` }} />
      <div
        style={{
          position: "absolute",
          left: box.x + 24,
          top: box.y + (box.h - dot) / 2,
          width: dot,
          height: dot,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 6,
          lineHeight: 1,
          opacity: words,
          transform: drift,
          ...handwriting(dot * 0.62, ink),
        }}
      >
        {index + 1}
      </div>
      <div
        style={{
          position: "absolute",
          left: box.x + left,
          top: box.y,
          width: box.w - left - 30,
          height: box.h,
          display: "flex",
          alignItems: "center",
          lineHeight: 1.05,
          opacity: words,
          transform: `${drift} translateY(${(1 - words) * 10}px)`,
          ...handwriting(size, ink),
        }}
      >
        {text}
      </div>
    </>
  );
};

/** A list: the lead-in over a brush stroke of the highlight colour, then one item per row, each painted in after the last. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const head = header ? boxes[0] : undefined;
  const paint = useEase(0, 18);
  const drift = useDrift(DRIFT);
  const words = useEase(4, 16);
  return (
    <AbsoluteFill>
      {head && (
        <>
          <Stroke box={head} tint={colour(palette, 3)} strength={0.5} seed={70} reveal={paint} drift={drift} palette={palette} />
          <div
            style={{
              position: "absolute",
              left: head.x,
              top: head.y,
              width: head.w,
              height: head.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 50px",
              boxSizing: "border-box",
              textAlign: "center",
              lineHeight: 1.02,
              opacity: words,
              transform: drift,
              ...handwriting(fitFontSize(header, { w: head.w - 100, h: head.h - 30 }, 86, 40, { charWidth: CHAR_WIDTH, lineHeight: 1.02 }), inkColour(palette)),
            }}
          >
            {header}
          </div>
        </>
      )}
      {items.map((text, i) => (
        <Item key={i} index={i} text={text} box={itemBoxes[i]!} palette={palette} />
      ))}
    </AbsoluteFill>
  );
};
