import { useMemo } from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { colour } from "./layout.js";
import { cloud, cutCircle, lifted, mix, nudge, nudged, paperImage, type Pt, STEP, star, tornEdge } from "./shared.js";

const W = 1080;
const H = 1920;

/** A layer of torn paper hills: its top edge rolls around `top` and is torn, showing the white core. */
function hill(top: number, amp: number, seed: number, fill: string, lift: number) {
  const h = H - top + amp + 40;
  const crest = (x: number) => amp + Math.sin((x / W) * Math.PI * 1.6 + seed) * amp * 0.7 + Math.sin((x / W) * Math.PI * 3.4 + seed * 2) * amp * 0.3;
  const ridge: Pt[] = [];
  for (let x = -60; x <= W + 60; x += 40) ridge.push([x, crest(x)]);
  const torn = ridge.flatMap((p, i) => (i < ridge.length - 1 ? tornEdge(p, ridge[i + 1]!, seed * 100 + i, { teeth: 7, depth: 2.2, wander: 1.5 }) : [p]));
  const outline: Pt[] = [...torn, [W + 60, h], [-60, h]];
  const rim: Pt[] = [...torn.map(([x, y], i) => [x, y - 2.5 - 4 * Math.abs(Math.sin(i * 0.37 + seed))] as Pt), [W + 60, h], [-60, h]];
  return { y: top - amp, src: paperImage(W, h, 40, [{ outline, rim, fill, shadow: lifted(lift, 0.32) }], seed) };
}

/** Bits of cut paper scattered at the edges, clear of the text column. */
const BITS = [
  { x: 70, y: 330, size: 26, role: 3 as const, kind: "star" },
  { x: 1010, y: 560, size: 20, role: 1 as const, kind: "dot" },
  { x: 48, y: 820, size: 16, role: 2 as const, kind: "dot" },
  { x: 1000, y: 1010, size: 24, role: 3 as const, kind: "star" },
];

/**
 * A sheet of coloured paper with a cut paper sun and cloud at the top and three torn hills at
 * the bottom, each layer lifted off the one behind it. Every layer is nudged by hand on each
 * exposure, twelve times a second.
 */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => {
  const step = Math.floor(useCurrentFrame() / STEP);
  const bg = colour(palette, 0);
  const layers = useMemo(() => {
    const sun = colour(palette, 3);
    const sunSrc = paperImage(360, 360, 40, [
      { outline: cutCircle(180, 180, 175, 11), fill: sun, shadow: lifted(10, 0.25) },
      { outline: cutCircle(180, 180, 118, 12), fill: mix(sun, "#FFFFFF", 0.35), shadow: lifted(5, 0.18) },
    ]);
    const cloudSrc = paperImage(330, 120, 40, [{ outline: cloud(330, 120, 21), fill: "#FFFFFF", shadow: lifted(9, 0.22), grain: 0.8 }], 25);
    const hills = [hill(1540, 70, 3, mix(colour(palette, 2), "#FFFFFF", 0.35), 10), hill(1640, 60, 5, colour(palette, 2), 12), hill(1760, 50, 7, colour(palette, 3), 14)];
    const bits = BITS.map((b, i) => {
      const s = b.size;
      const outline = b.kind === "star" ? star(s, s, s, 40 + i) : cutCircle(s, s, s * 0.6, 40 + i, 0.05);
      return { ...b, src: paperImage(2 * s, 2 * s, 14, [{ outline, fill: colour(palette, b.role), shadow: lifted(4, 0.28), grain: 0 }], 40 + i) };
    });
    return { sheet: paperImage(W, H, 0, [{ outline: [[0, 0], [W, 0], [W, H], [0, H]], fill: bg, grain: 0.9 }], 2), sunSrc, cloudSrc, hills, bits };
  }, [palette, bg]);
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <Img src={layers.sheet} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <Img src={layers.sunSrc} style={{ position: "absolute", left: 760 - 40, top: -150 - 40, width: 440, height: 440, transform: nudged(nudge(1, step, 1.2, 0.8)) }} />
      <Img src={layers.cloudSrc} style={{ position: "absolute", left: 20 - 40, top: 120 - 40, width: 410, height: 200, transform: nudged(nudge(2, step, 1.4, 0.4)) }} />
      {layers.bits.map((b, i) => (
        <Img key={i} src={b.src} style={{ position: "absolute", left: b.x - b.size - 14, top: b.y - b.size - 14, width: 2 * b.size + 28, height: 2 * b.size + 28, transform: nudged(nudge(10 + i, step, 1.5, 4)) }} />
      ))}
      {layers.hills.map((l, i) => (
        <Img key={i} src={l.src} style={{ position: "absolute", left: -40, top: l.y - 40, width: W + 80, height: H - l.y + 80 + 40, transform: nudged(nudge(5 + i, step, 1.4, 0.15)) }} />
      ))}
    </AbsoluteFill>
  );
};
