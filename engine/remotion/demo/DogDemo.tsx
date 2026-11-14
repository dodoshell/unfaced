import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { VideoPlan } from "../../src/plan/types.js";
import { characterParts } from "../core/character/parts.js";
import type { Part } from "../core/character/types.js";
import { VideoContext } from "../core/VideoContext.js";
import { getStyle } from "../styles/registry.js";
import { DEMO, DOG, dogDemoAt } from "./demoMotion.js";
import { ball, park } from "./scenery.js";

export type DogDemoProps = {
  style: number;
  /** Defaults to the style's own palette. */
  palette?: string[];
};

/** 1 figure unit = 1 pixel, for scenery drawn at its real size. */
const ACTUAL_SIZE = 100;

/**
 * The style demo: the same dog, park and ball in every style. Only the style's background
 * and its figure painter change, so the demos compare looks and nothing else.
 */
export const DogDemo: React.FC<DogDemoProps> = ({ style, palette }) => {
  const frame = useCurrentFrame();
  const kit = getStyle(style);
  const colours = palette ?? kit.defaultPalette;
  const plan: VideoPlan = { fps: DEMO.fps, width: 1080, height: 1920, durationInFrames: DEMO.durationInFrames, style, captions: 1, palette: colours, scenes: [] };
  const state = dogDemoAt(frame);
  const dog = characterParts(DOG, state.pose, state.poseFrame, DEMO.fps);
  const shadow = dog.filter((p) => p.role === "shadow");
  const body = dog.filter((p) => p.role !== "shadow");
  const r = DEMO.ballRadius;
  const ballShadow: Part = { kind: "ellipse", role: "shadow", cx: 0, cy: 0, rx: r * (1.1 - (DEMO.groundY - state.ballY) / 3000), ry: r * 0.25, rotate: 0, fill: "#000000" };
  const { Figure } = kit;
  return (
    <VideoContext.Provider value={{ plan, style: kit, palette: colours }}>
      <AbsoluteFill>
        <kit.Background palette={colours} />
        {park(DEMO.groundY).map((prop) => (
          <Figure key={prop.name} parts={prop.parts} palette={colours} x={prop.x} y={prop.y} size={ACTUAL_SIZE} />
        ))}
        {!state.caught && state.ballX < 1080 + r && <Figure parts={[ballShadow]} palette={colours} x={state.ballX} y={DEMO.groundY} size={ACTUAL_SIZE} />}
        <Figure parts={shadow} palette={colours} x={state.dogX} y={DEMO.groundY} size={DEMO.dogSize} />
        <Figure parts={body} palette={colours} x={state.dogX} y={DEMO.groundY - state.dogLift} size={DEMO.dogSize} />
        <Figure parts={ball(r, state.ballSpin)} palette={colours} x={state.ballX} y={state.ballY + r} size={ACTUAL_SIZE} />
      </AbsoluteFill>
    </VideoContext.Provider>
  );
};
