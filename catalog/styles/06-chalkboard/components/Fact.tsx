import { AbsoluteFill } from "remotion";
import { Character, factBadge, factNumber, type Pose, type Scene, useMascot, useVideo } from "../../../../engine/remotion/kit/index.js";
import { chalk } from "./colours.js";
import { layout } from "./layout.js";
import { Board, boiled, Chalk, dusty, FONT, grain, handLine, handLoop, handPolygon, type Pt, trembleOf, useBoil, useDraw, useWrite } from "./shared.js";

/** The mascot explains each fact a little differently. */
const FACT_POSES: Pose[] = ["talk", "point", "thinking"];

/** A five-pointed star around (cx, cy), drawn in one stroke. */
const starPoints = (cx: number, cy: number, r: number): Pt[] =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const k = i % 2 === 0 ? r : r * 0.45;
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });

/**
 * A fact: its number in big accent chalk inside a quick chalk circle that runs past its start,
 * with three strokes of emphasis in the secondary colour (a chalk star for script types that
 * don't number their beats). The captions carry the words.
 */
export const Fact: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const boil = useBoil();
  const { plan } = useVideo();
  const box = layout(scene, palette)[0]!;
  const ink = chalk(palette, 4);
  const accent = chalk(palette, 1);
  const n = factNumber(scene, plan.scenes);
  const label = factBadge(scene, plan.scenes, plan.scriptType);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = box.w / 2 - 30;
  const ring = useDraw(0, 20);
  const marks = useDraw(22, 10);
  const star = useDraw(10, 22);
  const write = useWrite(6, 10);
  const emphasis = [-62, -42, -22].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return boiled(handLine([cx + c * (r + 26), cy + s * (r + 26)], [cx + c * (r + 26 + 44 - i * 6), cy + s * (r + 26 + 44 - i * 6)], 40 + i, 2), 40 + i, boil, 1.2);
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={grain}>
        <Board>
          <Chalk points={boiled(handLoop(cx, cy, r, r * 0.93, 21 + n, 1.12, -110), 21, boil, 1.6)} p={ring} colour={ink} seed={21} boil={boil} />
          {emphasis.map((pts, i) => (
            <Chalk key={i} points={pts} p={marks} colour={chalk(palette, 2)} seed={40 + i} boil={boil} />
          ))}
          {!label && <Chalk points={boiled(handPolygon(starPoints(cx, cy + 10, r * 0.62), 31, 2, 24), 31, boil, 1.4)} closed p={star} colour={accent} seed={31} boil={boil} width={9} />}
        </Board>
        {label && (
          <div
            style={{
              position: "absolute",
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: label.length > 1 ? 240 : 300,
              lineHeight: 1,
              color: accent,
              ...dusty(accent),
              ...write,
            }}
          >
            <span style={{ display: "block", transform: trembleOf(boil, 5, -4), marginTop: -20 }}>{label}</span>
          </div>
        )}
      </AbsoluteFill>
      {mascot && <Character rig={mascot.rig} pose={FACT_POSES[n % FACT_POSES.length]!} x={cx} y={1150} size={230} />}
    </AbsoluteFill>
  );
};
