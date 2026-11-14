// Registers every style that has components. A new style adds two lines here and
// one in layouts.ts.
import { softThreeD } from "../../../catalog/styles/01-soft-3d/components/index.js";
import { flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/index.js";
import { lineArt } from "../../../catalog/styles/04-line-art/components/index.js";
import { chalkboard } from "../../../catalog/styles/06-chalkboard/components/index.js";
import { registerStyle } from "./registry.js";

registerStyle(softThreeD);
registerStyle(flatCartoon);
registerStyle(lineArt);
registerStyle(chalkboard);
