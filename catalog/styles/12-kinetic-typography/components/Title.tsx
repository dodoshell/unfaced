import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { CAP, drop, fitLines, keyword, lineGap, placeLines, rise } from "./kinetic.js";
import { colour, layout } from "./layout.js";
import { Line, paper, punch, typeOn, usePush } from "./shared.js";

const GAP = 0.12;

/**
 * The hook as a justified stack: every line scaled to fill the column, the line with the key
 * word on a highlight band. Complete on frame 0; the band punches when the voice says the key word.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mascot = useMascot();
  const push = usePush(0.035, scene.durationInFrames);
  const box = layout(scene, palette)[0]!;
  // The lines fill 96% of the column, so the push-in stays inside it.
  const lines = fitLines(scene.text, box, { maxLines: 7, maxSize: 400, gap: GAP, fill: 0.96 });
  const words = scene.text.split(/\s+/).filter(Boolean);
  const k = keyword(words);
  let seen = 0;
  const keyLine = lines.findIndex((l) => {
    seen += l.text.split(" ").length;
    return k < seen;
  });
  const spoken = scene.words.length === words.length ? scene.words[k] : undefined;
  // Without a voice that matches the written hook word for word, the band doesn't punch.
  const hit = spoken ? Math.round((spoken.startMs / 1000) * fps) - scene.fromFrame : undefined;
  const band = colour(palette, 3);
  const placed = placeLines(lines, box, GAP);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px` }}>
        {placed.map(({ line, top }, i) => {
          const isKey = i === keyLine;
          // The band reaches at most halfway into the gaps, so the lines next to it stay on the ground,
          // but always covers the line's own accents and cedillas (the gaps leave room for them).
          const above = i > 0 ? lineGap(lines[i - 1]!, line, GAP) : line.size;
          const below = i < lines.length - 1 ? lineGap(line, lines[i + 1]!, GAP) : line.size;
          const marks = (em: number) => (em > 0 ? (em + 0.02) * line.size : 0);
          const padTop = Math.max(Math.min(line.size * 0.09, above / 2), marks(rise(line.text)));
          const padBottom = Math.max(Math.min(line.size * 0.09, below / 2), marks(drop(line.text)));
          return (
            <div key={i}>
              {isKey && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: 1080,
                    top: top - padTop,
                    height: line.size * CAP + padTop + padBottom,
                    backgroundColor: band,
                    transform: `scaleY(${hit === undefined ? 1 : punch(frame, hit)})`,
                  }}
                />
              )}
              <Line line={line} x={box.x + (box.w - line.width) / 2} y={top} fill={isKey ? typeOn(band, palette) : paper(palette)} />
            </div>
          );
        })}
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={850} y={1300} size={130} />}
    </AbsoluteFill>
  );
};
