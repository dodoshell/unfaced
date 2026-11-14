import { AbsoluteFill } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { layout } from "./layout.js";
import { Burst, FocusLines, inks, LINE, MascotPanel, MASCOT_PANEL, MISREGISTER, PrintedText, useSlam } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A five-pointed star, for script types that don't number their beats. */
function star(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

/**
 * A fact: the fact's number in big off-register lettering on an explosion burst, over focus
 * lines. The burst slams in and shakes; the captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const c = inks(palette);
  const slam = useSlam();
  const box = layout(scene, palette)[0]!;
  const { plan } = useVideo();
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const size = label && label.length > 1 ? 250 : 320;
  return (
    <AbsoluteFill>
      <FocusLines cx={cx} cy={cy} inner={330} colour={c.ink} opacity={0.7} />
      {slam.shown && (
        <div style={{ position: "absolute", inset: 0, transform: `translate(${slam.shake}px, ${-slam.shake * 0.5}px) scale(${slam.scale})`, transformOrigin: `${cx}px ${cy}px` }}>
          <Burst cx={cx} cy={cy} outer={300} inner={235} points={13} fill={c.highlight} dots={c.accent} line={c.line} seed={n * 11} />
          <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {label ? (
              <PrintedText text={label} size={size} fill={c.balloon} line={c.line} extrude={c.secondary} style={{ marginTop: size * 0.12 }} />
            ) : (
              <svg width={box.w} height={box.h} style={{ overflow: "visible" }}>
                <path d={star(box.w / 2, box.h / 2 + 10, 150)} fill={c.balloon} transform={`translate(${MISREGISTER.x} ${MISREGISTER.y})`} />
                <path d={star(box.w / 2, box.h / 2 + 10, 150)} fill="none" stroke={c.line} strokeWidth={LINE} strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}
      {mascot && <MascotPanel c={c} />}
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={MASCOT_PANEL.x + MASCOT_PANEL.w / 2} y={MASCOT_PANEL.y + MASCOT_PANEL.h - 20} size={190} />}
    </AbsoluteFill>
  );
};
