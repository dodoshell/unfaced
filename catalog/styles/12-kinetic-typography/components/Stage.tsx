import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { captionStyle, type Rect, type Scene, useVideo } from "../../../../engine/remotion/kit/index.js";
import { beatAt, CAP, fitLines, stageBeats } from "./kinetic.js";
import { blocks, Line, punch, slam, typeOn } from "./shared.js";

/** Where the colour block reaches past the stage box, above and below. */
export const BLEED = 30;
const TICK = 18;

/**
 * The stage: a full-width block of colour holding the key word of the phrase being said, as big
 * as it fits. Each new phrase is a hard cut to the next block colour with the word slamming in;
 * the word punches again when the voice reaches it, and a row of ticks counts the phrase's words.
 */
export const Stage: React.FC<{ scene: Scene; palette: string[]; box: Rect; offset: number }> = ({ scene, palette, box, offset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { plan } = useVideo();
  const beats = useMemo(() => stageBeats(scene, fps, captionStyle(plan.captions).maxWords), [scene, fps, plan.captions]);
  const now = beatAt(beats, frame);
  if (!now) return null;
  const { beat, index } = now;
  const cycle = blocks(palette);
  const fill = cycle[(offset + index) % cycle.length]!;
  const ink = typeOn(fill, palette);
  const line = fitLines(beat.text, box, { maxLines: 1, maxSize: 720, fill: 0.94 })[0];
  // A push-in over the whole phrase, so the word keeps moving until the next cut.
  const push = 1 + 0.06 * Math.min(1, Math.max(0, frame - beat.from) / Math.max(1, beat.to - beat.from));
  const scale = slam(frame, beat.from) * (beat.hit > beat.from ? punch(frame, beat.hit) : 1) * push;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: box.y - BLEED, width: 1080, height: box.h + 2 * BLEED, backgroundColor: fill }} />
      {line && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px` }}>
          <Line line={line} x={box.x + (box.w - line.width) / 2} y={box.y + (box.h - line.size * CAP) / 2} fill={ink} />
        </div>
      )}
      {beat.ticks.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: box.x + i * (TICK + 10),
            top: box.y + box.h + (BLEED - TICK) / 2,
            width: TICK,
            height: TICK,
            boxSizing: "border-box",
            border: `3px solid ${ink}`,
            backgroundColor: frame >= t ? ink : "transparent",
          }}
        />
      ))}
    </>
  );
};
