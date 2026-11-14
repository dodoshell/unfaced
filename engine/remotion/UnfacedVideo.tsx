import { AbsoluteFill, Freeze, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { VideoPlan } from "../src/plan/types.js";
import { CaptionsView } from "./core/CaptionStyles.js";
import { EndingMark, markColours } from "./core/EndingMark.js";
import { END_MARK_BOX, endingMark, engineMarkSpan, LOOP_FADE_FRAMES, SEAMLESS_LOOP } from "./core/endings.js";
import { loadFonts } from "./core/fonts.js";
import { VideoContext } from "./core/VideoContext.js";
import { videoScene } from "./core/videoScenes.js";
import { drawsEndingMark } from "./styles/layouts.js";
import { getStyle, type StyleKit } from "./styles/registry.js";

loadFonts();

/** A loop's last frames fade into its first frame (scene and background, no captions yet), so the replay has no cut. */
const LoopBack: React.FC<{ plan: VideoPlan; style: StyleKit }> = ({ plan, style }) => {
  const opacity = interpolate(useCurrentFrame(), [0, LOOP_FADE_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const first = plan.scenes[0]!;
  const View = videoScene(first.beatId) ?? style.SceneView;
  return (
    <AbsoluteFill style={{ opacity }}>
      <Freeze frame={0}>
        <style.Background palette={plan.palette} />
        <View scene={first} palette={plan.palette} />
      </Freeze>
    </AbsoluteFill>
  );
};

/** One finished video: the style's background and scenes, the ending's sign, the soundtrack, the captions. */
export const UnfacedVideo: React.FC<{ plan: VideoPlan }> = ({ plan }) => {
  const style = getStyle(plan.style);
  const mark = endingMark(plan.ending);
  // A style that draws the sign in its own last scene keeps it, even under the video's own ending scene.
  const markSpan = engineMarkSpan(plan, drawsEndingMark(plan.style));
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
        {mark && markSpan && (
          <Sequence from={markSpan.fromFrame} durationInFrames={markSpan.toFrame - markSpan.fromFrame} name="ending mark">
            <EndingMark kind={mark} box={END_MARK_BOX} {...markColours(plan.palette)} />
          </Sequence>
        )}
        {plan.audioSrc && <Html5Audio src={staticFile(plan.audioSrc)} />}
        <CaptionsView plan={plan} />
        {plan.ending === SEAMLESS_LOOP && plan.scenes.length > 0 && (
          <Sequence from={plan.durationInFrames - LOOP_FADE_FRAMES} name="loop back">
            <LoopBack plan={plan} style={style} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VideoContext.Provider>
  );
};
