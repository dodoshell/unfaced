import { Composition } from "remotion";
import type { VideoPlan } from "../src/plan/types.js";
import { COMPOSITION_ID, DOG_DEMO_ID, HOOK_REEL_ID, MASCOT_SHEET_ID, STYLES_GRID_ID } from "./compositionId.js";
import { DEMO } from "./demo/demoMotion.js";
import { DogDemo } from "./demo/DogDemo.js";
import { GRID, gridHeight, StylesGrid, type StylesGridProps } from "./demo/StylesGrid.js";
import { MascotSheet, type MascotSheetProps, SHEET } from "./MascotSheet.js";
import { HookReel, type HookReelProps, reelDuration } from "./reel/HookReel.js";
import { rigFor } from "./core/character/rig.js";
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

const sampleReel: HookReelProps = { segments: [] };

const sampleGrid: StylesGridProps = { cells: [], bands: true };

const sampleSheet: MascotSheetProps = { style: 3, mascot: { name: "Miso", rig: rigFor("cat") }, palette: emptyPlan.palette };

export const RemotionRoot: React.FC = () => (
  <>
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
    <Composition
      id={DOG_DEMO_ID}
      component={DogDemo}
      defaultProps={{ style: 3 }}
      durationInFrames={DEMO.durationInFrames}
      fps={DEMO.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id={STYLES_GRID_ID}
      component={StylesGrid}
      defaultProps={sampleGrid}
      durationInFrames={DEMO.durationInFrames}
      fps={DEMO.fps}
      width={GRID.width}
      height={gridHeight(0, true)}
      calculateMetadata={({ props }) => ({ height: gridHeight(props.cells.length, props.bands) })}
    />
    <Composition
      id={HOOK_REEL_ID}
      component={HookReel}
      defaultProps={sampleReel}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={({ props }) => ({ durationInFrames: reelDuration(props.segments) })}
    />
    <Composition id={MASCOT_SHEET_ID} component={MascotSheet} defaultProps={sampleSheet} durationInFrames={1} fps={30} width={SHEET.width} height={SHEET.height} />
  </>
);
