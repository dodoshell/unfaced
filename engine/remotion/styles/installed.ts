// Registers every style that has components. A new style adds two lines here and
// one in layouts.ts.
import { softThreeD } from "../../../catalog/styles/01-soft-3d/components/index.js";
import { flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/index.js";
import { neonSynthwave } from "../../../catalog/styles/10-neon-synthwave/components/index.js";
import { kineticTypography } from "../../../catalog/styles/12-kinetic-typography/components/index.js";
import { registerStyle } from "./registry.js";

registerStyle(softThreeD);
registerStyle(flatCartoon);
registerStyle(neonSynthwave);
registerStyle(kineticTypography);
