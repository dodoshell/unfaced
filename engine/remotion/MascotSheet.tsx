import { AbsoluteFill } from "remotion";
import type { Mascot } from "../src/plan/types.js";
import { Character } from "./core/character/Character.js";
import { POSES, type Pose } from "./core/character/types.js";
import { readableOn } from "./core/contrast.js";
import { CAPTION_FONT, loadFonts } from "./core/fonts.js";
import { getStyle } from "./styles/registry.js";

loadFonts();

// A type, not an interface, so Remotion accepts it as composition props.
export type MascotSheetProps = {
  style: number;
  mascot: Mascot;
  palette: string[];
};

export const SHEET = { width: 1600, height: 1200 } as const;

/** The moment of each pose the sheet shows (frames at 30 fps): the top of a jump, an open mouth. */
const MOMENT: Partial<Record<Pose, number>> = { jump: 14, run: 3, talk: 4, happy: 9, walk: 6 };

/**
 * A mascot's reference sheet in one style: big views facing both ways, then every
 * pose. The video reviewer compares frames against it.
 */
export const MascotSheet: React.FC<MascotSheetProps> = ({ style: styleId, mascot, palette }) => {
  const style = getStyle(styleId);
  const [bg = "#FFFFFF", , , , paletteInk = "#1B1B1F"] = palette;
  // A dark palette can have a dark ink too (a night sky): the labels must still read.
  const ink = readableOn(bg, paletteInk);
  const label = (text: string, x: number, y: number, size = 30) => (
    <div style={{ position: "absolute", left: x - 150, top: y, width: 300, textAlign: "center", fontFamily: CAPTION_FONT, fontWeight: 600, fontSize: size, color: ink }}>{text}</div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <div style={{ position: "absolute", left: 60, top: 40, fontFamily: CAPTION_FONT, fontWeight: 700, fontSize: 64, color: ink }}>{mascot.name}</div>
      <div style={{ position: "absolute", left: 60, top: 120, fontFamily: CAPTION_FONT, fontWeight: 500, fontSize: 30, color: ink, opacity: 0.7 }}>
        Reference sheet · style {String(styleId).padStart(2, "0")} · {mascot.rig.species}
      </div>
      <Character style={style} palette={palette} rig={mascot.rig} pose="idle" x={560} y={520} size={250} />
      <Character style={style} palette={palette} rig={mascot.rig} pose="idle" x={1040} y={520} size={250} facing={-1} />
      {label("facing right", 560, 535)}
      {label("facing left", 1040, 535)}
      {POSES.map((pose, i) => {
        const x = 170 + (i % 5) * 315;
        const y = i < 5 ? 830 : 1120;
        return (
          <div key={pose}>
            <Character style={style} palette={palette} rig={mascot.rig} pose={pose} offset={MOMENT[pose] ?? 10} x={x} y={y - 40} size={150} />
            {label(pose, x, y - 30, 28)}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
