import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, layout } from "./layout.js";
import { cardImage, cardPaper, CHAR_WIDTH, fill, FONT, nudge, nudged, PaperImg, Puppet, tapeImage, useStopMotion } from "./shared.js";

const PAD = 40;

/**
 * The hook, written on a white card that is taped over a coloured sheet. Both are in place
 * on the first frame (the platforms' preview) and get nudged by hand on every exposure.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const { step } = useStopMotion();
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const ink = colour(palette, 4);
  const size = fitFontSize(scene.text, { w: box.w - 120, h: box.h - 110 }, 132, 56, { charWidth: CHAR_WIDTH, lineHeight: 1.08 });
  const images = useMemo(
    () => ({
      back: cardImage(box.w, box.h, colour(palette, 1), 71, 10),
      card: cardImage(box.w, box.h, cardPaper(palette), 72, 16),
      tapeL: tapeImage(190, 54, 73),
      tapeR: tapeImage(170, 54, 74),
    }),
    [box.w, box.h, palette],
  );
  return (
    <AbsoluteFill>
      <div style={{ ...fill(box), transform: nudged(nudge(31, step, 1.6, 0.4), "translate(26px, 22px) rotate(3.5deg)") }}>
        <PaperImg src={images.back} w={box.w} h={box.h} pad={PAD} />
      </div>
      <div style={{ ...fill(box), transform: nudged(nudge(32, step, 1.4, 0.35), "rotate(-1.5deg)") }}>
        <PaperImg src={images.card} w={box.w} h={box.h} pad={PAD} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "55px 60px",
            boxSizing: "border-box",
            textAlign: "center",
            fontFamily: FONT,
            fontSize: size,
            lineHeight: 1.08,
            color: ink,
          }}
        >
          {scene.text}
        </div>
        <div style={{ position: "absolute", left: -40, top: -6, transform: nudged(nudge(33, step, 0.8, 1), "rotate(-38deg)") }}>
          <PaperImg src={images.tapeL} w={190} h={54} pad={12} />
        </div>
        <div style={{ position: "absolute", left: box.w - 140, top: -10, transform: nudged(nudge(34, step, 0.8, 1), "rotate(36deg)") }}>
          <PaperImg src={images.tapeR} w={170} h={54} pad={12} />
        </div>
      </div>
      {mascot && <Puppet rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
