import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { CAPTION_FONT } from "../core/fonts.js";

export type StylesGridProps = {
  /** One cell per style demo: its MP4 (relative to the render's public folder) and its label. */
  cells: { src: string; label: string }[];
  /** A title band above the grid and a line below it, for the all-styles video; none for the README GIF. */
  bands: boolean;
};

export const GRID = { cols: 4, cellW: 270, cellH: 480, band: 240, width: 1080 } as const;

/** The height of the grid composition for `cells` cells. */
export const gridHeight = (cells: number, bands: boolean): number => Math.ceil(Math.max(cells, 1) / GRID.cols) * GRID.cellH + (bands ? 2 * GRID.band : 0);

const INK = "#1B1B3A";

/** Every style's dog demo side by side, playing in sync: the same scene, only the look changes. */
export const StylesGrid: React.FC<StylesGridProps> = ({ cells, bands }) => {
  const top = bands ? GRID.band : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: CAPTION_FONT }}>
      {bands && (
        <div style={{ position: "absolute", left: 0, top: 0, width: GRID.width, height: GRID.band, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#FFF4E0" }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: 2 }}>unfaced</div>
          <div style={{ fontSize: 44, fontWeight: 500, opacity: 0.85 }}>{cells.length} styles, one dog</div>
        </div>
      )}
      {cells.map((cell, i) => (
        <div key={cell.src} style={{ position: "absolute", left: (i % GRID.cols) * GRID.cellW, top: top + Math.floor(i / GRID.cols) * GRID.cellH, width: GRID.cellW, height: GRID.cellH, overflow: "hidden" }}>
          <OffthreadVideo src={staticFile(cell.src)} muted style={{ width: GRID.cellW, height: GRID.cellH }} />
          <div style={{ position: "absolute", left: 10, bottom: 10, padding: "4px 12px", borderRadius: 14, backgroundColor: "rgba(27, 27, 58, 0.82)", color: "#FFFFFF", fontSize: 22, fontWeight: 600 }}>{cell.label}</div>
        </div>
      ))}
      {bands && (
        <div style={{ position: "absolute", left: 0, top: GRID.band + gridHeight(cells.length, false), width: GRID.width, height: GRID.band, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF4E0", fontSize: 40, fontWeight: 500, textAlign: "center", padding: "0 80px", boxSizing: "border-box" }}>
          Same scene, same motion. Only the look changes.
        </div>
      )}
    </AbsoluteFill>
  );
};
