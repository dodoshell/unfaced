// Remotion entry point for post render tests: the real root with only the test-only slide view.
import { registerRoot } from "remotion";
import { RemotionRoot } from "../../../engine/remotion/Root.js";
import { registerSlideView } from "../../../engine/remotion/styles/slideViews.js";
import { PLACEHOLDER_SLIDES } from "./placeholderSlides.js";
import { PlaceholderSlideView } from "./placeholderSlidesView.js";

registerSlideView(PLACEHOLDER_SLIDES, PlaceholderSlideView);
registerRoot(RemotionRoot);
