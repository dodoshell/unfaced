import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Character, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { colour, layout, ORBITRON, TITLE_PAD, titleType } from "./layout.js";
import { alpha, DISPLAY, glowText, night, roundRectPath, TEXT, Tube, useHum } from "./shared.js";

/** The sign's tubes flicker twice as it warms up, but the lettering is lit from the first frame. */
const WARM_UP: Record<number, number> = { 7: 0.35, 8: 0.8, 10: 0.45, 24: 0.7 };

/** The hook as a neon sign: glowing letters on dark glass in a double tube frame. */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const mascot = useMascot();
  const hum = useHum(1);
  const box = layout(scene, palette)[0]!;
  const type = titleType(scene.text, box);
  const accent = colour(palette, 1);
  const secondary = colour(palette, 2);
  // Complete on frame 0 (the platforms' preview), then a slight settle from 1.04×.
  const settle = interpolate(frame, [0, 16], [1.04, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const tubes = (WARM_UP[frame] ?? 1) * hum;
  const pad = 14;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, transform: `scale(${settle})` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 44, backgroundColor: alpha(night(palette), 0.76) }} />
        <svg width={box.w} height={box.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Tube d={roundRectPath(0, 0, box.w, box.h, 44)} colour={accent} width={6} opacity={tubes} />
          <Tube d={roundRectPath(pad + 6, pad + 6, box.w - 2 * (pad + 6), box.h - 2 * (pad + 6), 30)} colour={secondary} width={2.5} opacity={tubes * 0.8} />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: `${TITLE_PAD.y}px ${TITLE_PAD.x}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            textWrap: "balance",
            fontFamily: type.font === "display" ? DISPLAY : TEXT,
            fontWeight: type.font === "display" ? 400 : 800,
            fontSize: type.size,
            lineHeight: type.font === "display" ? 1.2 : ORBITRON.lineHeight,
            // Monoton's own space is a sliver; words need air between them.
            wordSpacing: type.font === "display" ? "0.28em" : undefined,
            ...glowText(accent, type.size, { left: secondary, right: accent, offset: Math.max(2, Math.round(type.size / 34)) }),
            opacity: 0.94 + 0.06 * hum,
          }}
        >
          {scene.text}
        </div>
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={800} y={1170} size={170} />}
    </AbsoluteFill>
  );
};
