// Registers every style that has components. A new style adds two lines here and
// one in layouts.ts. A style that makes posts also registers its SlideView here with
// registerSlideView (slideViews.ts), and its layout in slideLayouts.ts; it needs no video
// scenes to do so.
import { softThreeD } from "../../../catalog/styles/01-soft-3d/components/index.js";
import { lowPoly } from "../../../catalog/styles/02-90s-low-poly/components/index.js";
import { flatCartoon } from "../../../catalog/styles/03-flat-cartoon/components/index.js";
import { lineArt } from "../../../catalog/styles/04-line-art/components/index.js";
import { inkSilhouette } from "../../../catalog/styles/05-ink-silhouette/components/index.js";
import { chalkboard } from "../../../catalog/styles/06-chalkboard/components/index.js";
import { paperCutOut } from "../../../catalog/styles/07-paper-cut-out/components/index.js";
import { vintageComic } from "../../../catalog/styles/08-vintage-comic/components/index.js";
import { pixelArt } from "../../../catalog/styles/09-16-bit-pixel-art/components/index.js";
import { neonSynthwave } from "../../../catalog/styles/10-neon-synthwave/components/index.js";
import { watercolour } from "../../../catalog/styles/11-watercolour/components/index.js";
import { kineticTypography } from "../../../catalog/styles/12-kinetic-typography/components/index.js";
import { nightTechSlides } from "../../../catalog/styles/13-night-tech/components/slides/index.js";
import { registerStyle } from "./registry.js";
import { registerSlideView } from "./slideViews.js";

registerStyle(softThreeD);
registerStyle(lowPoly);
registerStyle(flatCartoon);
registerStyle(lineArt);
registerStyle(inkSilhouette);
registerStyle(chalkboard);
registerStyle(paperCutOut);
registerStyle(vintageComic);
registerStyle(pixelArt);
registerStyle(neonSynthwave);
registerStyle(watercolour);
registerStyle(kineticTypography);

// Styles that make posts (style 13 has no video scenes yet).
registerSlideView(13, nightTechSlides.SlideView);
