// The style demo: a dog runs across a park, jumps to catch a ball and lands. The motion,
// timing and framing are computed here once, so every style shows exactly the same scene;
// only the painting changes. Pure: tests and the composition share it.
import { characterParts } from "../core/character/parts.js";
import { rigFor } from "../core/character/rig.js";
import type { Part, Pose } from "../core/character/types.js";

export const DEMO = {
  fps: 30,
  durationInFrames: 180,
  /** Screen y of the grass line, where the dog's feet touch. */
  groundY: 1380,
  /** Pixels per 100 figure units: the dog is about this tall. */
  dogSize: 440,
  /** The ball's radius in pixels. */
  ballRadius: 30,
} as const;

export const DOG = rigFor("dog");

// Phases, in frames.
const JUMP_START = 72;
/** The jump pose's own cycle: crouch until 0.15 s, airborne until 0.8 s, then landing. */
const TAKE_OFF = 0.15 * DEMO.fps;
const TOUCH_DOWN = 0.8 * DEMO.fps;
/** The top of the jump, where the ball is caught. */
export const CATCH_FRAME = JUMP_START + Math.round((TAKE_OFF + TOUCH_DOWN) / 2);
const LAND = JUMP_START + DEMO.fps;
const HAPPY_END = 140;
const THROW = 30;

/** Extra height of the demo's jump on top of the pose's own lift, in pixels. */
const JUMP_HEIGHT = 200;
/** The ball's fall in pixels per frame², so it flies in a real arc. */
const GRAVITY = 1.2;
const BALL_START = { x: 1180, y: 760 };
/** Where the ball sits relative to the mouth, in figure units (in front of the open jaw). */
const HOLD = [7, 3] as const;

export interface DemoState {
  /** Screen position of the ground point under the dog. */
  dogX: number;
  /** How far the demo lifts the dog off the grass, in pixels (0 on the ground). */
  dogLift: number;
  pose: Pose;
  /** The frame inside the current pose, so each pose starts from its beginning. */
  poseFrame: number;
  ballX: number;
  ballY: number;
  /** Degrees, for the ball's seam. */
  ballSpin: number;
  caught: boolean;
}

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function dogAt(frame: number): Pick<DemoState, "dogX" | "dogLift" | "pose" | "poseFrame"> {
  if (frame < JUMP_START) return { dogX: lerp(-400, 420, frame / JUMP_START), dogLift: 0, pose: "run", poseFrame: frame };
  if (frame < LAND) {
    const f = frame - JUMP_START;
    const air = (f - TAKE_OFF) / (TOUCH_DOWN - TAKE_OFF);
    return { dogX: lerp(420, 610, f / DEMO.fps), dogLift: air > 0 && air < 1 ? JUMP_HEIGHT * Math.sin(Math.PI * air) : 0, pose: "jump", poseFrame: f };
  }
  if (frame < HAPPY_END) return { dogX: lerp(610, 660, ease((frame - LAND) / (HAPPY_END - LAND))), dogLift: 0, pose: "happy", poseFrame: frame - LAND };
  return { dogX: 660, dogLift: 0, pose: "idle", poseFrame: frame - HAPPY_END };
}

/** The middle of a part, in figure units. */
function centre(part: Part): [number, number] {
  switch (part.kind) {
    case "ellipse":
      return [part.cx, part.cy];
    case "capsule":
      return [(part.x1 + part.x2) / 2, (part.y1 + part.y2) / 2];
    case "mark":
      return [part.x, part.y];
    case "stroke":
    case "shape": {
      const xs = part.points.map((p) => p[0]);
      const ys = part.points.map((p) => p[1]);
      return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    }
  }
}

/** The dog's mouth on screen at a frame (the centre of its mouth part). */
export function mouthAt(frame: number): { x: number; y: number } {
  const dog = dogAt(frame);
  const mouth = characterParts(DOG, dog.pose, dog.poseFrame, DEMO.fps).find((p) => p.role === "mouth");
  if (!mouth) throw new Error("the dog has no mouth part");
  const [mx, my] = centre(mouth);
  const scale = DEMO.dogSize / 100;
  return { x: dog.dogX + (mx + HOLD[0]) * scale, y: DEMO.groundY - dog.dogLift + (my + HOLD[1]) * scale };
}

const catchPoint = mouthAt(CATCH_FRAME);
const flight = CATCH_FRAME - THROW;
const ballVy = (catchPoint.y - BALL_START.y - 0.5 * GRAVITY * flight ** 2) / flight;

/** Everything on screen at a frame of the demo. */
export function dogDemoAt(frame: number): DemoState {
  const dog = dogAt(frame);
  if (frame >= CATCH_FRAME) {
    const held = mouthAt(frame);
    return { ...dog, ballX: held.x, ballY: held.y, ballSpin: 0, caught: true };
  }
  const t = Math.max(0, frame - THROW);
  return {
    ...dog,
    ballX: lerp(BALL_START.x, catchPoint.x, t / flight),
    ballY: BALL_START.y + ballVy * t + 0.5 * GRAVITY * t ** 2,
    ballSpin: -t * 14,
    caught: false,
  };
}
