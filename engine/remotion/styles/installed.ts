// Registers every style that has components. A new style adds two lines here and
// one in layouts.ts.
import { flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/index.js";
import { registerStyle } from "./registry.js";

registerStyle(flatCartoon);
