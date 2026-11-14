// Remotion entry point: registers every built style, then the root.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root.js";
import "./styles/installed.js";

registerRoot(RemotionRoot);
