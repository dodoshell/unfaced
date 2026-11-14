import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, inkColour, layout } from "./layout.js";
import { FONT, LINE, Pen, rectPath, Sheet, useDraw } from "./shared.js";

const PAD_X = 64;
const PAD_Y = 56;
const UNDERLINE = 150;

/**
 * The hook in clean type inside an outlined box. The words and the box are complete on the
 * first frame (the platforms' preview); an accent underline is drawn under the words, and the
 * accent pen traces the box once round while the hook is on screen.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const box = layout(scene, palette)[0]!;
  const ink = inkColour(palette);
  const under = useDraw(4, 22);
  const trace = Math.min(1, useCurrentFrame() / Math.max(1, scene.durationInFrames - 1));
  const size = fitFontSize(scene.text, { w: box.w - 2 * PAD_X, h: box.h - 2 * PAD_Y - 50 }, 132, 52, { charWidth: 0.55, lineHeight: 1.1 });
  return (
    <AbsoluteFill>
      <Sheet>
        <Pen d={rectPath(box.x, box.y, box.w, box.h)} p={1} colour={ink} />
        <Pen d={rectPath(box.x, box.y, box.w, box.h)} p={trace} colour={colour(palette, 1)} />
      </Sheet>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          padding: `${PAD_Y}px ${PAD_X}px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.02em", color: ink }}>{scene.text}</div>
        <svg width={UNDERLINE} height={LINE} style={{ marginTop: Math.round(size * 0.42), overflow: "visible" }}>
          <Pen d={`M ${LINE / 2} ${LINE / 2} H ${UNDERLINE - LINE / 2}`} p={under} colour={colour(palette, 1)} />
        </svg>
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
