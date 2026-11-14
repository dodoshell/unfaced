import { AbsoluteFill } from "remotion";
import { Character, fitFontSize, type Scene, useMascot } from "../../../../engine/remotion/kit/index.js";
import { BANGERS, layout } from "./layout.js";
import { focusPath, inks, LINE, lettering, Panel, useBoil, useFlicker, useSlam } from "./shared.js";

/** The top panel, holding the balloon, and the panel under it where the mascot reacts. */
const TOP = { x: 70, y: 250, w: 860, h: 800 };
const BOTTOM = { x: 120, y: 1100, w: 820, h: 410 };
/** Where the mascot stands in the bottom panel; the balloon's tail points at its head. */
const SPEAKER = { x: 520, y: 1470, size: 250 };

/**
 * A speech balloon around the words: a superellipse (rounder than a rectangle, fuller than an
 * oval) whose tail runs down to the speaker. `wobble` nudges the outline like a hand-inked line.
 */
function balloonPath(cx: number, cy: number, a: number, b: number, tail: { x: number; y: number }, wobble: number): string {
  const pts: Array<[number, number]> = [];
  const n = 96;
  // The tail leaves the balloon around this angle (down and to the right).
  const at = Math.atan2((tail.y - cy) / b, (tail.x - cx) / a);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const k = 1 + 0.008 * Math.sin(t * 5 + wobble);
    pts.push([cx + a * k * Math.sign(c) * Math.abs(c) ** 0.5, cy + b * k * Math.sign(s) * Math.abs(s) ** 0.5]);
  }
  // Splice the tail in between the two points either side of its angle.
  const gap = 0.075;
  const i0 = Math.round(((at - gap + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * n) % n;
  const i1 = Math.round(((at + gap + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * n) % n;
  const out: string[] = [];
  for (let k = 0; k < n; k++) {
    const i = (i1 + k) % n;
    out.push(`${pts[i]![0].toFixed(1)} ${pts[i]![1].toFixed(1)}`);
    if (i === i0) {
      out.push(`${tail.x.toFixed(1)} ${tail.y.toFixed(1)}`);
      break;
    }
  }
  return `M ${out.join(" L ")} Z`;
}

/**
 * A comic page of two panels: the hook in a big speech balloon over a tilted pop-art panel
 * (yellow with red Ben-Day dots), and under it, across a gutter, the mascot reacting in a
 * blue-tinted panel with focus lines, the balloon's tail reaching down to it. Complete on the
 * first frame (the platforms' preview); the panels shake once from the impact.
 */
export const Title: React.FC<{ scene: Scene; palette: string[] }> = ({ scene, palette }) => {
  const mascot = useMascot();
  const c = inks(palette);
  const boil = useBoil();
  const box = layout(scene, palette)[0]!;
  const size = fitFontSize(scene.text, { w: box.w - 20, h: box.h - 20 }, 150, 58, BANGERS);
  const flicker = useFlicker();
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Complete on frame 0: only the slam's shake, as if the page had just landed.
  const { shake } = useSlam(-4);
  const tail = mascot ? { x: SPEAKER.x + 70, y: BOTTOM.y + 95 } : { x: 760, y: 1060 };
  const d = balloonPath(cx, cy, box.w / 2 / 0.84, box.h / 2 / 0.84, tail, boil * 2.1);
  return (
    <AbsoluteFill>
      <Panel {...TOP} fill={c.highlight} dots={c.accent} line={c.line} rotate={-2.5} style={{ translate: `${shake}px 0` }} />
      {mascot && (
        <Panel {...BOTTOM} fill={c.balloon} dots={c.secondary} dotRadius={2.6} line={c.line} rotate={1.5} style={{ translate: `${-shake}px 0` }}>
          <svg width={BOTTOM.w - 2 * LINE} height={BOTTOM.h - 2 * LINE} style={{ position: "absolute", left: LINE, top: LINE }}>
            <path d={focusPath(SPEAKER.x - BOTTOM.x + 40 - LINE, SPEAKER.y - BOTTOM.y - 150 - LINE, 150, flicker, 40)} fill={c.line} opacity={0.75} />
          </svg>
        </Panel>
      )}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={d} fill={c.balloon} stroke={c.line} strokeWidth={LINE} strokeLinejoin="round" />
      </svg>
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
          textAlign: "center",
          ...lettering(c.line, size),
        }}
      >
        {scene.text}
      </div>
      {mascot && <Character rig={mascot.rig} pose="surprised" x={SPEAKER.x} y={SPEAKER.y} size={SPEAKER.size} />}
    </AbsoluteFill>
  );
};
