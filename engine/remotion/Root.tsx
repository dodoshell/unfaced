import { Composition } from "remotion";
import type { VideoPlan } from "../src/plan/types.js";
import { COMPOSITION_ID } from "./compositionId.js";
import { UnfacedVideo } from "./UnfacedVideo.js";

// Shown only in Remotion Studio when no plan is passed in.
const emptyPlan: VideoPlan = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 30,
  style: 3,
  captions: 1,
  palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"],
  audioSrc: "voice.wav",
  scenes: [],
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id={COMPOSITION_ID}
    component={UnfacedVideo}
    defaultProps={{ plan: emptyPlan }}
    durationInFrames={emptyPlan.durationInFrames}
    fps={30}
    width={1080}
    height={1920}
    calculateMetadata={({ props }) => ({ durationInFrames: props.plan.durationInFrames })}
  />
);
