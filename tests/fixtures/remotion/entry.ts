// Remotion entry point for render tests: the real root with only the placeholder style.
import { registerRoot } from "remotion";
import { RemotionRoot } from "../../../engine/remotion/Root.js";
import { registerStyle } from "../../../engine/remotion/styles/registry.js";
import { placeholderStyle } from "./placeholderStyle.js";

registerStyle(placeholderStyle);
registerRoot(RemotionRoot);
