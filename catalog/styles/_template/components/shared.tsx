import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "../../../../engine/remotion/kit/index.js";
import fontUrl from "../../../../engine/remotion/fonts/Fredoka.ttf";

/** The style's font. A real style ships its own in ../fonts/ and lists it in LICENSES/README.md. */
export const FONT = "Template Sans";
loadFont(FONT, fontUrl, { weight: "300 700" });

/** 0 → 1 over about half a second, starting `delay` frames into the scene. */
export function useEnter(delay = 0): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
}
