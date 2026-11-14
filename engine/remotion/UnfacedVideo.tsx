import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import type { VideoPlan } from "../src/plan/types.js";
import { Captions } from "./core/Captions.js";
import { loadFonts } from "./core/fonts.js";
import { getStyle } from "./styles/registry.js";

loadFonts();

/** One finished video: the style's background and scenes, the voice-over, the captions. */
export const UnfacedVideo: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const style = getStyle(plan.style);
  return (
    <AbsoluteFill>
      <style.Background palette={plan.palette} />
      {plan.scenes.map((scene) => (
        <Sequence key={scene.beatId} from={scene.fromFrame} durationInFrames={scene.durationInFrames} name={scene.beatId}>
          <style.SceneView scene={scene} palette={plan.palette} />
        </Sequence>
      ))}
      <Html5Audio src={staticFile(plan.audioSrc)} />
      {plan.captions === 1 && <Captions plan={plan} />}
    </AbsoluteFill>
  );
};
