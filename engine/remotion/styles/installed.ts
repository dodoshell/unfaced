// Registers every style that has components. A new style adds two lines here and
// one in layouts.ts.
import { softThreeD } from "../../../catalog/styles/01-soft-3d/components/index.js";
import { flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/index.js";
import { inkSilhouette } from "../../../catalog/styles/05-ink-silhouette/components/index.js";
import { registerStyle } from "./registry.js";

registerStyle(softThreeD);
registerStyle(flatCartoon);
registerStyle(inkSilhouette);
