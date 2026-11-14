import type { FigureProps, Part } from "../../../../engine/remotion/kit/index.js";
import { rasterise, snap, translucent } from "./pixels.js";
import { FONT, outlineInk, Sprite } from "./shared.js";

/**
 * Characters and the demo's park as 16-bit sprites: the parts rasterised onto the 6 px grid,
 * each solid part lit along its top row and shaded along its bottom, a one-pixel outline
 * round the silhouette, dithered ground shadows. The figure moves in whole pixels.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, x, y, size }) => {
  const ink = outlineInk(palette);
  const scale = size / 100;
  const ox = snap(x);
  const oy = snap(y);
  const raster = rasterise(parts, { x: ox, y: oy, scale, outline: ink, shade: true, shadow: translucent(ink, 0.5) });
  const marks = parts.filter((p): p is Extract<Part, { kind: "mark" }> => p.kind === "mark");
  return (
    <>
      <Sprite raster={raster} />
      {marks.map((m, i) => {
        const px = m.size * scale;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: snap(ox + m.x * scale - px),
              top: snap(oy + m.y * scale - px * 1.05),
              width: px * 2,
              textAlign: "center",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: px * 1.15,
              lineHeight: 1,
              color: m.colour,
              textShadow: `4px 0 0 #FFFFFF, -4px 0 0 #FFFFFF, 0 4px 0 #FFFFFF, 0 -4px 0 #FFFFFF`,
            }}
          >
            {m.glyph}
          </div>
        );
      })}
    </>
  );
};
