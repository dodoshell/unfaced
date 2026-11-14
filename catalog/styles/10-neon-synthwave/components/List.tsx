import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fitFontSize, listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { colour, layout, ORBITRON } from "./layout.js";
import { alpha, glowText, night, roundRectPath, TEXT, Tube, useHum, useIgnite } from "./shared.js";

const ITEM_STAGGER = 6;

/** One row: dark glass in a neon tube, sliding in from the right as its tube strikes. */
const Row: React.FC<{ text: string; box: Rect; delay: number; tube: string; palette: string[]; number?: number; seed: number }> = ({ text, box, delay, tube, palette, number, seed }) => {
  const frame = useCurrentFrame();
  const lit = useIgnite(delay);
  const hum = useHum(seed);
  const slide = Math.max(0, 1 - (frame - delay) / 8) ** 2;
  const numberW = number === undefined ? 0 : Math.min(box.h - 20, 110);
  const left = number === undefined ? 40 : 24 + numberW + 20;
  const header = number === undefined;
  const size = fitFontSize(text, { w: box.w - left - 40, h: box.h - 28 }, header ? 60 : 56, 28, ORBITRON);
  const numberSize = Math.round(numberW * 0.62);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, transform: `translateX(${slide * 160}px)`, opacity: Math.min(1, lit * 1.4) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, backgroundColor: alpha(night(palette), header ? 0.6 : 0.78) }} />
      <svg width={box.w} height={box.h} style={{ position: "absolute", overflow: "visible" }}>
        <Tube d={roundRectPath(0, 0, box.w, box.h, 24)} colour={tube} width={header ? 3 : 4.5} opacity={lit * hum} />
      </svg>
      {number !== undefined && (
        <div
          style={{
            position: "absolute",
            left: 24,
            top: (box.h - numberW) / 2,
            width: numberW,
            height: numberW,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TEXT,
            fontWeight: 900,
            fontSize: numberSize,
            lineHeight: 1,
            ...glowText(tube, numberSize),
            opacity: lit * hum,
          }}
        >
          {number}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingLeft: left,
          paddingRight: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: header ? "center" : "flex-start",
          textAlign: header ? "center" : "left",
          textWrap: "balance",
          fontFamily: TEXT,
          fontWeight: header ? 800 : 600,
          fontSize: size,
          lineHeight: ORBITRON.lineHeight,
          ...(header ? glowText(tube, size) : { color: "#FFFFFF", textShadow: `0 0 10px ${alpha(tube, 0.7)}, 0 0 24px ${alpha(tube, 0.35)}` }),
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** A list: the lead-in as a gold sign, then one neon row per item, striking up one after another. */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const tubes = [colour(palette, 1), colour(palette, 2)];
  return (
    <AbsoluteFill>
      {header && <Row text={header} box={boxes[0]!} delay={0} tube={colour(palette, 3)} palette={palette} seed={9} />}
      {items.map((item, i) => (
        <Row key={i} text={item} box={itemBoxes[i]!} delay={6 + i * ITEM_STAGGER} tube={tubes[i % 2]!} palette={palette} number={i + 1} seed={i} />
      ))}
    </AbsoluteFill>
  );
};
