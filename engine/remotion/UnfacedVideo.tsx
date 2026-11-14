import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import type { VideoPlan } from "../src/plan/types.js";
import { Captions } from "./core/Captions.js";
import { loadFonts } from "./core/fonts.js";
import { VideoContext } from "./core/VideoContext.js";
import { videoScene } from "./core/videoScenes.js";
import { getStyle } from "./styles/registry.js";

loadFonts();

/** One finished video: the style's background and scenes, the soundtrack, the captions. */
export const UnfacedVideo: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const style = getStyle(plan.style);
  return (
    <VideoContext.Provider value={{ plan, style, palette: plan.palette }}>
      <AbsoluteFill>
        <style.Background palette={plan.palette} />
        {plan.scenes.map((scene) => {
          const View = videoScene(scene.beatId) ?? style.SceneView;
          return (
            <Sequence key={scene.beatId} from={scene.fromFrame} durationInFrames={scene.durationInFrames} name={scene.beatId}>
              <View scene={scene} palette={plan.palette} />
            </Sequence>
          );
        })}
        {plan.audioSrc && <Html5Audio src={staticFile(plan.audioSrc)} />}
        {plan.captions === 1 && <Captions plan={plan} />}
      </AbsoluteFill>
    </VideoContext.Provider>
  );
};
