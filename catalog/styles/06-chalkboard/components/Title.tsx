import { AbsoluteFill } from "remotion";
import { Character, fitFontSize, type Scene, useMascot, wrapLines } from "../../../../engine/remotion/kit/index.js";
import { chalk } from "./colours.js";
import { layout } from "./layout.js";
import { boiled, Chalk, dusty, FONT, grain, handLine, trembleOf, useBoil, useDraw } from "./shared.js";

const PAD = 30;
const FIT = { charWidth: 0.44, lineHeight: 1.02 };

/**
 * The hook in big chalk handwriting, slightly askew, complete on the first frame (the
 * platforms' preview); two quick strokes of accent chalk underline it.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const boil = useBoil();
  const box = layout(scene, palette)[0]!;
  const ink = chalk(palette, 4);
  const accent = chalk(palette, 1);
  const textW = box.w - 2 * PAD;
  const size = fitFontSize(scene.text, { w: textW, h: box.h - 2 * PAD - 70 }, 172, 64, FIT);
  const widest = Math.min(textW, Math.max(...wrapLines(scene.text, textW, size * FIT.charWidth).map((l) => l.length * size * FIT.charWidth)));
  const first = useDraw(6, 14);
  const second = useDraw(16, 12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={grain}>
        <div
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            padding: PAD,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: FIT.lineHeight, color: ink, textAlign: "center", transform: trembleOf(boil, 1, -2), ...dusty(ink) }}>
            {scene.text}
          </div>
          <svg width={widest} height={56} style={{ marginTop: 6, overflow: "visible", transform: "rotate(-2deg)" }}>
            <Chalk points={boiled(handLine([0, 16], [widest, 8], 11, 5), 11, boil, 1.5)} p={first} colour={accent} seed={11} boil={boil} />
            <Chalk points={boiled(handLine([widest * 0.1, 40], [widest * 0.86, 33], 12, 5), 12, boil, 1.5)} p={second} colour={accent} seed={12} boil={boil} />
          </svg>
        </div>
      </AbsoluteFill>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1165} size={170} />}
    </AbsoluteFill>
  );
};
