import { AbsoluteFill } from "remotion";
import { colour } from "./layout.js";

/** Plain paper: line art keeps the page empty so every line counts. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => <AbsoluteFill style={{ backgroundColor: colour(palette, 0) }} />;
