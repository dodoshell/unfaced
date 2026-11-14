import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import type { Scene, VideoPlan } from "../../src/plan/types.js";
import { CAPTION_FONT } from "../core/fonts.js";
import { VideoContext } from "../core/VideoContext.js";
import { getStyle } from "../styles/registry.js";

export type HookReelProps = {
  segments: { text: string; label: string; style: number; fromFrame: number; durationInFrames: number }[];
  audioSrc?: string;
};

export const reelDuration = (segments: HookReelProps["segments"]): number => {
  const last = segments.at(-1);
  return last ? last.fromFrame + last.durationInFrames : 1;
};

/** One hook line over a style's own title scene, with the hook's name below. */
const Line: React.FC<{ segment: HookReelProps["segments"][number] }> = ({ segment }) => {
  const kit = getStyle(segment.style);
  const scene: Scene = { beatId: "hook", kind: "title", text: segment.text, fromFrame: 0, durationInFrames: segment.durationInFrames, words: [] };
  const plan: VideoPlan = { fps: 30, width: 1080, height: 1920, durationInFrames: segment.durationInFrames, style: segment.style, captions: 1, palette: kit.defaultPalette, scenes: [scene] };
  return (
    <VideoContext.Provider value={{ plan, style: kit, palette: kit.defaultPalette }}>
      <AbsoluteFill>
        <kit.Background palette={kit.defaultPalette} />
        <kit.SceneView scene={scene} palette={kit.defaultPalette} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1460, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "14px 34px", borderRadius: 40, backgroundColor: "rgba(27, 27, 58, 0.85)", color: "#FFFFFF", fontFamily: CAPTION_FONT, fontWeight: 600, fontSize: 44 }}>{segment.label}</div>
        </div>
      </AbsoluteFill>
    </VideoContext.Provider>
  );
};

/** The hook reel: every hook's opening line, each in the next style in turn. */
export const HookReel: React.FC<HookReelProps> = ({ segments, audioSrc }) => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }}>
    {segments.map((s) => (
      <Sequence key={s.fromFrame} from={s.fromFrame} durationInFrames={s.durationInFrames} name={s.label}>
        <Line segment={s} />
      </Sequence>
    ))}
    {audioSrc && <Html5Audio src={staticFile(audioSrc)} />}
  </AbsoluteFill>
);
