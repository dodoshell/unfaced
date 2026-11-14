import { AbsoluteFill } from "remotion";
import { colour } from "./layout.js";

/** A flat background colour. Most styles add texture or shapes here. */
export const Background: React.FC<{ palette: string[] }> = ({ palette }) => <AbsoluteFill style={{ backgroundColor: colour(palette, 0) }} />;
