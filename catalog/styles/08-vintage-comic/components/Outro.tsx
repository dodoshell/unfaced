import { AbsoluteFill, Sequence } from "remotion";
import { Character, EndingMark, endingMark, endingPose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { layout } from "./layout.js";
import { Burst, FocusLines, inks, MascotPanel, MASCOT_PANEL, PrintedText, useSlam } from "./shared.js";

/**
 * The ending: a red explosion burst over focus lines, slamming in. It holds the ending's sign
 * (a question bubble, a follow button...) or, for a punchline, a big "!".
 */
export const Outro: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const ending = useVideo().plan.ending;
  const mark = endingMark(ending);
  const c = inks(palette);
  const slam = useSlam();
  const box = layout(scene, palette)[0]!;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const sign = box.w * 0.62;
  return (
    <AbsoluteFill>
      <FocusLines cx={cx} cy={cy} inner={300} colour={c.ink} opacity={0.7} />
      {slam.shown && (
        <div style={{ position: "absolute", inset: 0, transform: `translate(${slam.shake}px, ${slam.shake * 0.5}px) scale(${slam.scale})`, transformOrigin: `${cx}px ${cy}px` }}>
          <Burst cx={cx} cy={cy} outer={285} inner={215} points={16} fill={c.accent} dots={c.highlight} line={c.line} seed={91} />
          {mark ? (
            // Started 20 frames in: the burst already slams, so the sign doesn't pop a second time.
            <Sequence from={-20} layout="none">
              <EndingMark kind={mark} box={{ x: cx - sign / 2, y: cy - sign / 2, w: sign, h: sign }} fill={c.highlight} ink={c.line} />
            </Sequence>
          ) : (
            <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PrintedText text="!" size={330} fill={c.balloon} line={c.line} extrude={c.secondary} style={{ marginTop: 40 }} />
            </div>
          )}
        </div>
      )}
      {mascot && <MascotPanel c={c} />}
      {mascot && <Character rig={mascot.rig} pose={endingPose(ending)} x={MASCOT_PANEL.x + MASCOT_PANEL.w / 2} y={MASCOT_PANEL.y + MASCOT_PANEL.h - 20} size={190} />}
    </AbsoluteFill>
  );
};
