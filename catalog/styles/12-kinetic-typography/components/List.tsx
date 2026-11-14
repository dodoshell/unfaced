import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { listParts, type Rect, type Scene } from "../../../../engine/remotion/kit/index.js";
import { CAP, fitLines, listReveal, stackHeight, type TypeLine } from "./kinetic.js";
import { colour, layout } from "./layout.js";
import { Line, paper, slam, typeOn } from "./shared.js";

const GAP = 0.12;

/** A stack of lines, left aligned, centred in the height of `box`. */
const Stack: React.FC<{ lines: TypeLine[]; box: Rect; fill: string }> = ({ lines, box, fill }) => {
  let y = box.y + (box.h - stackHeight(lines, GAP)) / 2;
  return (
    <>
      {lines.map((line, i) => {
        if (i > 0) y += GAP * Math.min(line.size, lines[i - 1]!.size);
        const top = y;
        y += line.size * CAP;
        return <Line key={i} line={line} x={box.x} y={top} fill={fill} />;
      })}
    </>
  );
};

/**
 * A list: the lead-in in big capitals, then each item slamming in as the voice reaches it, behind
 * a numbered colour block. The item being said sits on a highlight band; numbers of items still
 * to come wait, dimmed, in their rows.
 */
export const List: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { header, items } = listParts(scene.text);
  const boxes = layout(scene, palette);
  const itemBoxes = header ? boxes.slice(1) : boxes;
  const reveal = useMemo(() => listReveal(scene, fps), [scene, fps]);
  const current = reveal.reduce((last, at, i) => (at <= frame ? i : last), -1);
  const ink = paper(palette);
  const headerBox = header ? boxes[0]! : undefined;
  // The highlight is the band of the item being said; the number blocks take accent and secondary in turn.
  const band = colour(palette, 3);
  const tags = [colour(palette, 1), colour(palette, 2)];
  return (
    <AbsoluteFill>
      {headerBox && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${slam(frame, 0)})`, transformOrigin: `${headerBox.x}px ${headerBox.y}px` }}>
          <Stack lines={fitLines(header, headerBox, { maxLines: 2, maxSize: 170, gap: GAP })} box={headerBox} fill={ink} />
        </div>
      )}
      {items.map((item, i) => {
        const box = itemBoxes[i]!;
        const tag = Math.min(box.h, 150);
        const block = tags[i % 2]!;
        const shown = frame >= reveal[i]!;
        const number = fitLines(String(i + 1).padStart(2, "0"), { w: tag - 28, h: tag - 36 }, { maxLines: 1, maxSize: 200 })[0]!;
        const text = { x: box.x + tag + 22, y: box.y, w: box.w - tag - 22, h: box.h };
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `scale(${slam(frame, reveal[i]!)})`, transformOrigin: `${box.x}px ${box.y + box.h / 2}px` }}>
            <div style={{ position: "absolute", left: box.x, top: box.y + (box.h - tag) / 2, width: tag, height: tag, backgroundColor: block, opacity: shown ? 1 : 0.22 }} />
            <Line line={number} x={box.x + (tag - number.width) / 2} y={box.y + (box.h - number.size * CAP) / 2} fill={typeOn(block, palette)} style={{ opacity: shown ? 1 : 0.4 }} />
            {i === current && <div style={{ position: "absolute", left: text.x - 14, top: box.y, width: 1080 - text.x + 14, height: box.h, backgroundColor: band }} />}
            {shown && <Stack lines={fitLines(item, text, { maxLines: 2, maxSize: 200, gap: GAP })} box={text} fill={i === current ? typeOn(band, palette) : ink} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
