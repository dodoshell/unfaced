// Geometry and motion of the shared character system: a rig in a pose at a given frame
// becomes a list of simple parts (ellipses, capsules, strokes, shapes, marks) that any
// style can paint. Pure, so tests and checks can run it without rendering.
import type { MarkPart, Part, Pose, Rig, Role } from "./types.js";

type Pt = [number, number];

const TAU = Math.PI * 2;
const wave = (t: number, period: number, phase = 0) => Math.sin((TAU * t) / period + phase);

interface Motion {
  /** Units off the ground. */
  lift: number;
  dx: number;
  /** Degrees, nose up. */
  tilt: number;
  /** Vertical scale of the body. */
  squash: number;
  head: { tilt: number; dy: number };
  /** Degrees from vertical, forward positive. Quadruped: front, back, front far, back far. Biped: near, far. */
  legs: number[];
  /** Fraction the legs are bent (shortened) by. */
  bend: number;
  /** Degrees from hanging down, forward positive: near, far. */
  arms: [number, number];
  /** Degrees, up positive. */
  tail: number;
  /** Degrees, forward (perked) positive, back or drooping negative. */
  ears: number;
  eyes: "open" | "wide" | "closed" | "happy" | "sad";
  look: Pt;
  mouth: { shape: "smile" | "frown" | "flat" | "open" | "o" | "grin"; open: number };
  /** 1 raised, -1 sad, 0 none. */
  brows: number;
  cheeks: boolean;
  mark?: { glyph: MarkPart["glyph"]; bob: number };
}

const rest = (): Motion => ({
  lift: 0,
  dx: 0,
  tilt: 0,
  squash: 1,
  head: { tilt: 0, dy: 0 },
  legs: [0, 0, 0, 0],
  bend: 0,
  arms: [6, -4],
  tail: 0,
  ears: 0,
  eyes: "open",
  look: [0, 0],
  mouth: { shape: "smile", open: 0 },
  brows: 0,
  cheeks: false,
});

const blinking = (t: number) => t % 3.2 > 3.08;

/** How a pose moves at `t` seconds. Cyclic poses loop; jump repeats once a second. */
function motionAt(rig: Rig, pose: Pose, t: number): Motion {
  const m = rest();
  const quad = rig.build === "quadruped";
  switch (pose) {
    case "idle":
      m.squash = 1 + 0.015 * wave(t, 2.4);
      m.head.dy = 0.6 * wave(t, 2.4);
      m.tail = 8 * wave(t, 1.8);
      if (blinking(t)) m.eyes = "closed";
      break;
    case "walk": {
      const s = wave(t, 0.9);
      m.legs = quad ? [18 * s, -18 * s, -18 * s, 18 * s] : [22 * s, -22 * s];
      m.arms = [6 - 20 * s, -4 + 20 * s];
      m.lift = 1.5 * Math.abs(wave(t, 0.9, Math.PI / 2));
      m.tail = 12 * wave(t, 0.45);
      m.head.dy = 0.8 * Math.abs(s);
      break;
    }
    case "run": {
      const s = wave(t, 0.42);
      const s2 = wave(t, 0.42, 0.5);
      m.legs = quad ? [38 * s + 8, -38 * s - 4, 38 * s2 + 8, -38 * s2 - 4] : [40 * s, -40 * s];
      m.arms = [-45 * s + 10, 45 * s - 10];
      m.tilt = quad ? 6 * s : -10;
      m.lift = 6 * Math.abs(s);
      m.ears = -25;
      m.tail = -15 + 6 * s;
      m.mouth = { shape: "open", open: 0.5 + 0.1 * s };
      break;
    }
    case "jump": {
      const u = t % 1;
      if (u < 0.15) {
        const k = u / 0.15;
        m.squash = 1 - 0.1 * k;
        m.bend = 0.25 * k;
      } else if (u < 0.8) {
        const a = (u - 0.15) / 0.65;
        m.lift = 30 * Math.sin(Math.PI * a);
        m.legs = quad ? [55, -55, 50, -50] : [35, -25];
        m.arms = [110, 100];
        m.tilt = 10 * Math.cos(Math.PI * a);
        m.ears = -15;
        m.tail = 15;
        m.mouth = { shape: "open", open: 0.4 };
      } else {
        const k = (u - 0.8) / 0.2;
        m.squash = 0.9 + 0.1 * k;
        m.bend = 0.25 * (1 - k);
      }
      break;
    }
    case "point":
      if (quad) m.legs = [70, 0, 0, 0];
      m.arms = [95 + 4 * wave(t, 1.2), -4];
      m.tilt = 4;
      m.head.tilt = 6;
      m.head.dy = 0.8 * wave(t, 1.2);
      m.look = [1.5, 0];
      m.tail = 10 * wave(t, 0.5);
      break;
    case "talk":
      m.mouth = { shape: "open", open: 0.15 + 0.55 * Math.abs(wave(t, 0.44)) * (0.6 + 0.4 * Math.abs(wave(t, 1.8))) };
      m.head.tilt = 3 * wave(t, 0.9);
      m.head.dy = 0.8 * wave(t, 0.45);
      m.arms = [25 + 15 * wave(t, 1.1), -4 + 6 * wave(t, 1.3)];
      m.tail = 6 * wave(t, 1.4);
      if (blinking(t)) m.eyes = "closed";
      break;
    case "surprised":
      m.eyes = "wide";
      m.brows = 1;
      m.mouth = { shape: "o", open: 0.8 };
      m.ears = 15;
      m.tilt = 6;
      m.lift = 4 * Math.max(0, wave(t, 1.2));
      m.dx = -2;
      m.arms = [95, 85];
      m.tail = 20;
      m.mark = { glyph: "!", bob: 2 * wave(t, 0.5) };
      break;
    case "happy": {
      const hop = Math.abs(wave(t, 0.6));
      m.eyes = "happy";
      m.mouth = { shape: "grin", open: 0.5 };
      m.cheeks = true;
      m.lift = 7 * hop;
      m.squash = 1 - 0.05 * (1 - hop);
      m.tail = 10 + 25 * wave(t, 0.25);
      m.ears = 8;
      m.arms = [110 + 20 * wave(t, 0.3), 100 - 20 * wave(t, 0.3)];
      break;
    }
    case "sad":
      m.eyes = "sad";
      m.brows = -1;
      m.mouth = { shape: "frown", open: 0 };
      m.head = { tilt: -10, dy: 3 };
      m.ears = -30;
      m.tail = -25;
      m.squash = 0.97 + 0.01 * wave(t, 3);
      m.arms = [2, -2];
      m.tilt = -3;
      break;
    case "thinking":
      m.head.tilt = 10;
      m.look = [1, -2];
      m.mouth = { shape: "flat", open: 0 };
      m.brows = 0.6;
      if (quad) m.legs = [25, 0, 0, 0];
      m.arms = [130, -4];
      m.tail = 10 * wave(t, 2.2);
      m.mark = { glyph: "?", bob: 2 * wave(t, 0.8) };
      break;
  }
  return m;
}

// ---------------------------------------------------------------------------------
// Geometry helpers

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Rotates `p` around `c` by `deg` degrees clockwise (y down). */
function rotate(p: Pt, c: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** Moves a part with a point mapping, adding `deg` to rotated shapes. */
function mapPart(p: Part, f: (pt: Pt) => Pt, deg: number): Part {
  switch (p.kind) {
    case "ellipse": {
      const [cx, cy] = f([p.cx, p.cy]);
      return { ...p, cx, cy, rotate: p.rotate + deg };
    }
    case "capsule": {
      const [x1, y1] = f([p.x1, p.y1]);
      const [x2, y2] = f([p.x2, p.y2]);
      return { ...p, x1, y1, x2, y2 };
    }
    case "stroke":
    case "shape":
      return { ...p, points: p.points.map(f) };
    case "mark": {
      const [x, y] = f([p.x, p.y]);
      return { ...p, x, y };
    }
  }
}

function roundPart(p: Part): Part {
  switch (p.kind) {
    case "ellipse":
      return { ...p, cx: r2(p.cx), cy: r2(p.cy), rx: r2(p.rx), ry: r2(p.ry), rotate: r2(p.rotate) };
    case "capsule":
      return { ...p, x1: r2(p.x1), y1: r2(p.y1), x2: r2(p.x2), y2: r2(p.y2), r: r2(p.r) };
    case "stroke":
      return { ...p, width: r2(p.width), points: p.points.map(([x, y]) => [r2(x), r2(y)] as Pt) };
    case "shape":
      return { ...p, points: p.points.map(([x, y]) => [r2(x), r2(y)] as Pt) };
    case "mark":
      return { ...p, x: r2(p.x), y: r2(p.y) };
  }
}

/** The part's bounding box in figure units. */
export function partBounds(p: Part): { left: number; right: number; top: number; bottom: number } {
  switch (p.kind) {
    case "ellipse": {
      const a = (p.rotate * Math.PI) / 180;
      const hx = Math.hypot(p.rx * Math.cos(a), p.ry * Math.sin(a));
      const hy = Math.hypot(p.rx * Math.sin(a), p.ry * Math.cos(a));
      return { left: p.cx - hx, right: p.cx + hx, top: p.cy - hy, bottom: p.cy + hy };
    }
    case "capsule":
      return { left: Math.min(p.x1, p.x2) - p.r, right: Math.max(p.x1, p.x2) + p.r, top: Math.min(p.y1, p.y2) - p.r, bottom: Math.max(p.y1, p.y2) + p.r };
    case "stroke":
    case "shape": {
      const pad = p.kind === "stroke" ? p.width / 2 : 0;
      const xs = p.points.map((q) => q[0]);
      const ys = p.points.map((q) => q[1]);
      return { left: Math.min(...xs) - pad, right: Math.max(...xs) + pad, top: Math.min(...ys) - pad, bottom: Math.max(...ys) + pad };
    }
    case "mark":
      return { left: p.x - p.size * 0.35, right: p.x + p.size * 0.35, top: p.y - p.size, bottom: p.y };
  }
}

/** A hex colour mixed towards black by `k` (0..1); other colour formats are returned as they are. */
export function shade(colour: string, k: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(colour);
  if (!m) return colour;
  const n = parseInt(m[1]!, 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - k));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

const ellipse = (role: Role, cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0): Part => ({ kind: "ellipse", role, cx, cy, rx, ry, rotate: rot, fill });
const capsule = (role: Role, a: Pt, b: Pt, r: number, fill: string): Part => ({ kind: "capsule", role, x1: a[0], y1: a[1], x2: b[0], y2: b[1], r, fill });
const stroke = (role: Role, points: Pt[], width: number, colour: string): Part => ({ kind: "stroke", role, points, width, colour, line: role !== "tail" && role !== "pattern" });
const shape = (role: Role, points: Pt[], fill: string): Part => ({ kind: "shape", role, points, fill });
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];
/** The end of a limb of length `len` from `from`, at `deg` from straight down (forward positive). */
const limb = (from: Pt, deg: number, len: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [from[0] + Math.sin(a) * len, from[1] + Math.cos(a) * len];
};

const BODY = {
  quadruped: { round: [28, 21], long: [34, 18], tall: [26, 23] },
  biped: { round: [22, 22], long: [24, 20], tall: [19, 27] },
} as const;
const HEAD = {
  quadruped: { round: [19, 17], wide: [22, 16], tall: [17, 20] },
  biped: { round: [21, 19], wide: [24, 18], tall: [19, 22] },
} as const;
const LEG_R = 5.5;

/**
 * The parts of `rig` in `pose` at `frame`, back to front, in figure units (see
 * types.ts). The same rig, pose and frame always give the same parts.
 */
export function characterParts(rig: Rig, pose: Pose, frame: number, fps: number): Part[] {
  const m = motionAt(rig, pose, frame / fps);
  const quad = rig.build === "quadruped";
  const ink = rig.colours.ink ?? "#1B1B1F";
  const bodyFill = rig.colours.body;
  const headFill = rig.colours.head ?? bodyFill;
  const legFill = rig.colours.legs ?? bodyFill;
  const hairFill = rig.colours.hair ?? rig.colours.accent;

  // Body and limbs, in the body frame (no lift or tilt yet).
  const [brx, bry] = BODY[rig.build][rig.body];
  const legLen = quad ? 15 : 14;
  const hipY = -(legLen + LEG_R);
  const bcx = 0;
  const bcy = quad ? hipY - bry * 0.45 : hipY - bry * 0.75;
  const [hrx, hry] = HEAD[rig.build][rig.head];
  const hc: Pt = quad ? [brx * 0.78, bcy - bry * 0.85 - hry * 0.35] : [3, bcy - bry - hry * 0.55 + m.head.dy];
  if (quad) hc[1] += m.head.dy;
  const neck: Pt = quad ? [bcx + brx * 0.62, bcy - bry * 0.6] : [hc[0] - 1, bcy - bry * 0.92];

  const back: Part[] = [];
  const front: Part[] = [];
  const headParts: Part[] = [];
  const behindHead: Part[] = [];

  // Tail.
  const tailBase: Pt = quad ? [bcx - brx * 0.92, bcy - bry * 0.2] : [bcx - brx * 0.9, bcy + bry * 0.3];
  const tp = (q: Pt) => add(tailBase, rotate(q, [0, 0], m.tail));
  if (rig.tail === "thin") back.push(stroke("tail", [tailBase, tp([-10, -6]), tp([-14, -20]), tp([-10, -30])], 6, bodyFill));
  if (rig.tail === "short" && quad) back.push(stroke("tail", [tailBase, tp([-7, -8]), tp([-9, -15])], 7, bodyFill));
  if (rig.tail === "short" && !quad) back.push(ellipse("tail", tailBase[0] - 2, tailBase[1], 6, 6, rig.colours.belly));
  if (rig.tail === "fluffy" && quad) {
    const c = tp([-16, -8]);
    back.push(ellipse("tail", c[0], c[1], 17, 8.5, bodyFill, -30 + m.tail));
    const tip = tp([-28, -14]);
    back.push(ellipse("tail", tip[0], tip[1], 6, 5, rig.colours.belly, -30 + m.tail));
  }
  if (rig.tail === "fluffy" && !quad) {
    // Tail feathers, pointing down and back.
    const c = tp([-9, 4]);
    back.push(ellipse("tail", c[0], c[1], 11, 5.5, shade(bodyFill, 0.1), 35 + m.tail));
  }

  // Legs.
  const len = legLen * (1 - m.bend);
  if (quad) {
    const hips: Pt[] = [
      [bcx + brx * 0.55, hipY],
      [bcx - brx * 0.55, hipY],
      [bcx + brx * 0.55 + 5, hipY],
      [bcx - brx * 0.55 + 5, hipY],
    ];
    hips.forEach((hip, i) => {
      const far = i >= 2;
      const leg = capsule(far ? "leg-far" : "leg", hip, limb(hip, m.legs[i] ?? 0, len), LEG_R, far ? shade(legFill, 0.18) : legFill);
      (far ? back : front).push(leg);
    });
  } else {
    const near: Pt = [bcx + 4, hipY];
    const farHip: Pt = [bcx - 4, hipY];
    back.push(capsule("leg-far", farHip, limb(farHip, m.legs[1] ?? 0, len), LEG_R, shade(legFill, 0.18)));
    front.push(capsule("leg", near, limb(near, m.legs[0] ?? 0, len), LEG_R, legFill));
  }

  // Arms (bipeds), far one behind the body.
  const arms: Part[] = [];
  if (!quad) {
    const shoulders: Pt[] = [
      [bcx + brx * 0.15, bcy - bry * 0.45],
      [bcx - brx * 0.25, bcy - bry * 0.5],
    ];
    shoulders.forEach((s, i) => {
      const end = limb(s, m.arms[i]!, 18);
      const parts = [capsule(i === 0 ? "arm" : "arm-far", s, end, 5, i === 0 ? bodyFill : shade(bodyFill, 0.18))];
      if (rig.colours.head && rig.species === "person") parts.push(ellipse("hand", end[0], end[1], 4.5, 4.5, i === 0 ? headFill : shade(headFill, 0.12)));
      (i === 0 ? arms : back).push(...parts);
    });
  }

  // Body, belly, pattern.
  const bodyParts: Part[] = [ellipse("body", bcx, bcy + bry * (1 - m.squash), brx, bry * m.squash, bodyFill)];
  if (rig.colours.belly !== bodyFill) {
    bodyParts.push(quad ? ellipse("belly", bcx + brx * 0.15, bcy + bry * 0.45, brx * 0.62, bry * 0.45, rig.colours.belly) : ellipse("belly", bcx + brx * 0.2, bcy + bry * 0.15, brx * 0.6, bry * 0.68, rig.colours.belly));
  }
  if (rig.pattern === "stripes") {
    for (let i = 0; i < 3; i++) {
      const x = bcx - brx * 0.35 + i * brx * 0.3;
      bodyParts.push(stroke("pattern", [[x - 2, bcy - bry * 0.8], [x + 1, bcy - bry * 0.4]], 4, shade(bodyFill, 0.28)));
    }
  }
  if (rig.pattern === "spots") {
    bodyParts.push(ellipse("pattern", bcx - brx * 0.4, bcy - bry * 0.3, 4.5, 3.5, rig.colours.accent), ellipse("pattern", bcx + brx * 0.1, bcy - bry * 0.55, 3.5, 3, rig.colours.accent), ellipse("pattern", bcx - brx * 0.05, bcy + bry * 0.1, 3, 2.5, rig.colours.accent));
  }

  // Neck accessories.
  const neckParts: Part[] = [];
  if (rig.accessories.includes("collar")) {
    neckParts.push(capsule("accessory", [neck[0] - 6, neck[1] - 4], [neck[0] + 6, neck[1] + 5], 2.8, rig.colours.accent));
    neckParts.push(ellipse("accessory", neck[0] + 5, neck[1] + 9, 3, 3, "#F2C14E"));
  }
  if (rig.accessories.includes("scarf")) {
    neckParts.push(capsule("accessory", [neck[0] - 10, neck[1]], [neck[0] + 10, neck[1] + 3], 5, rig.colours.accent));
    neckParts.push(capsule("accessory", [neck[0] - 6, neck[1] + 2], [neck[0] - 10 - m.lift * 0.2, neck[1] + 16], 4, shade(rig.colours.accent, 0.12)));
  }

  // Head: ears, head, face, hair, head accessories.
  const [hx, hy] = hc;
  if (rig.ears === "pointy") {
    const ear = (bx: number, by: number, role: Role, fill: string, inner: boolean) => {
      const base: Pt = [bx, by];
      const pts: Pt[] = [
        [bx - 8, by + 4],
        [bx + 8, by + 2],
        [bx - 2, by - 20],
      ].map((p) => rotate(p as Pt, base, m.ears)) as Pt[];
      const parts = [shape(role, pts, fill)];
      if (inner) parts.push(shape("ear-inner", ([[bx - 4, by + 1], [bx + 4, by], [bx - 1.5, by - 13]] as Pt[]).map((p) => rotate(p, base, m.ears)), rig.colours.accent));
      return parts;
    };
    behindHead.push(...ear(hx + hrx * 0.15, hy - hry * 0.72, "ear-far", shade(bodyFill, 0.18), false));
    behindHead.push(...ear(hx - hrx * 0.45, hy - hry * 0.7, "ear", bodyFill, true));
  }
  if (rig.ears === "round") {
    behindHead.push(ellipse("ear-far", hx + hrx * 0.25, hy - hry * 0.88, 7.5, 7.5, shade(bodyFill, 0.18)));
    behindHead.push(ellipse("ear", hx - hrx * 0.5, hy - hry * 0.8, 7.5, 7.5, bodyFill), ellipse("ear-inner", hx - hrx * 0.5, hy - hry * 0.8, 4, 4, rig.colours.accent));
  }
  if (rig.ears === "long") {
    const longEar = (bx: number, role: Role, fill: string, inner: boolean) => {
      const base: Pt = [bx, hy - hry * 0.8];
      const angle = -8 + (role === "ear-far" ? 14 : 0) + m.ears * 0.6;
      const c = add(base, rotate([0, -17], [0, 0], angle));
      const parts = [ellipse(role, c[0], c[1], 6.5, 17, fill, angle)];
      if (inner) parts.push(ellipse("ear-inner", c[0], c[1] + 1, 3.2, 12, rig.colours.accent, angle));
      return parts;
    };
    behindHead.push(...longEar(hx + hrx * 0.2, "ear-far", shade(bodyFill, 0.18), false));
    behindHead.push(...longEar(hx - hrx * 0.3, "ear", bodyFill, true));
  }
  if (rig.ears === "floppy") {
    const rot = 12 - m.ears * 0.8;
    behindHead.push(ellipse("ear-far", hx + hrx * 0.1, hy - hry * 0.1, 7, 15, shade(rig.colours.accent, 0), rot));
    headParts.push(ellipse("ear", hx - hrx * 0.35, hy + hry * 0.05, 7, 15, rig.colours.accent, rot));
  }

  const head: Part[] = [ellipse("head", hx, hy, hrx, hry, headFill)];
  if (rig.hair === "bob") {
    behindHead.push(ellipse("hair", hx - 3, hy - hry * 0.2, hrx * 1.08, hry * 0.9, hairFill));
    head.push(ellipse("hair", hx + 1, hy - hry * 0.7, hrx * 0.95, hry * 0.38, hairFill, -6));
  }
  if (rig.hair === "tuft") {
    head.push(shape("hair", [[hx - 6, hy - hry + 2], [hx - 2, hy - hry - 12], [hx + 1, hy - hry + 1], [hx + 4, hy - hry - 9], [hx + 6, hy - hry + 2]], rig.colours.hair ?? shade(bodyFill, 0.15)));
  }
  if (rig.hair === "spiky") {
    behindHead.push(shape("hair", [[hx - 14, hy - hry * 0.6], [hx - 10, hy - hry - 10], [hx - 4, hy - hry * 0.85], [hx + 1, hy - hry - 13], [hx + 6, hy - hry * 0.85], [hx + 11, hy - hry - 9], [hx + 14, hy - hry * 0.6]], rig.colours.hair ?? bodyFill));
  }

  // Snout.
  const snout: Part[] = [];
  let mouthAt: Pt = [hx + hrx * 0.5, hy + hry * 0.42];
  if (rig.snout === "short" || rig.snout === "long") {
    const mrx = rig.snout === "long" ? 12 : 8;
    const mry = rig.snout === "long" ? 7 : 6.5;
    const mx = hx + hrx * 0.72 + (rig.snout === "long" ? 3 : 0);
    const my = hy + hry * 0.32;
    snout.push(ellipse("muzzle", mx, my, mrx, mry, rig.colours.belly));
    snout.push(ellipse("nose", mx + mrx * 0.78, my - mry * 0.45, 3, 2.3, ink));
    mouthAt = [mx + mrx * 0.15, my + mry * 0.55];
  }
  if (rig.snout === "beak") {
    const bx = hx + hrx * 0.82;
    const open = m.mouth.shape === "open" || m.mouth.shape === "o" || m.mouth.shape === "grin" ? m.mouth.open * 22 : 0;
    snout.push(shape("beak", [[bx, hy + 4], [bx + 13, hy + 4], [bx, hy + 9]].map((p) => rotate(p as Pt, [bx, hy + 4], open)) as Pt[], shade(rig.colours.accent, 0.12)));
    snout.push(shape("beak", [[bx, hy - 3], [bx + 15, hy + 3], [bx, hy + 5]], rig.colours.accent));
    mouthAt = [bx + 3, hy + 6];
  }

  // Eyes.
  const eyes: Part[] = [];
  const eyeAt = (near: boolean): Pt => add(near ? [hx + hrx * 0.28, hy - hry * 0.18] : [hx + hrx * 0.72, hy - hry * 0.22], m.look);
  for (const near of [true, false]) {
    const [ex, ey] = eyeAt(near);
    const k = near ? 1 : 0.82;
    switch (m.eyes) {
      case "closed":
        eyes.push(stroke("eye", [[ex - 3.5 * k, ey], [ex, ey + 1], [ex + 3.5 * k, ey]], 1.8, ink));
        break;
      case "happy":
        eyes.push(stroke("eye", [[ex - 3.5 * k, ey + 1.5], [ex, ey - 2], [ex + 3.5 * k, ey + 1.5]], 2, ink));
        break;
      case "sad":
        eyes.push(ellipse("eye", ex, ey + 1, 3.1 * k, 3.6, ink), ellipse("eye-shine", ex + 0.9, ey - 0.6, 1.1, 1.1, "#FFFFFF"));
        break;
      default: {
        const big = m.eyes === "wide" ? 1.25 : 1;
        eyes.push(ellipse("eye", ex, ey, 3.4 * k * big, 4.4 * big, ink), ellipse("eye-shine", ex + 1, ey - 1.5, 1.2 * big, 1.2 * big, "#FFFFFF"));
      }
    }
    if (m.brows !== 0) {
      const lift = m.brows > 0 ? 2 * m.brows : 0;
      const by = ey - 8 - lift;
      const inner = m.brows < 0 ? 2.5 : 0;
      eyes.push(stroke("brow", near ? [[ex - 3.5, by], [ex + 3.5, by - inner]] : [[ex - 3, by - inner], [ex + 3, by]], 1.8, ink));
    }
  }
  if (m.cheeks) eyes.push(ellipse("cheek", hx + hrx * 0.35, hy + hry * 0.3, 3.8, 2.4, "rgba(255,110,140,0.55)"));

  // Mouth.
  const mouth: Part[] = [];
  const [mx, my] = mouthAt;
  const mouthFill = "#5A1E2A";
  if (rig.snout === "beak") {
    if (m.mouth.open > 0.1 && (m.mouth.shape === "open" || m.mouth.shape === "o" || m.mouth.shape === "grin")) mouth.push(ellipse("mouth", mx, my, 2.5, 1 + m.mouth.open * 2.5, mouthFill));
  } else {
    switch (m.mouth.shape) {
      case "smile":
        mouth.push(stroke("mouth", [[mx - 4, my - 1], [mx, my + 1.5], [mx + 4, my - 1]], 1.8, ink));
        break;
      case "frown":
        mouth.push(stroke("mouth", [[mx - 4, my + 1.5], [mx, my - 1], [mx + 4, my + 1.5]], 1.8, ink));
        break;
      case "flat":
        mouth.push(stroke("mouth", [[mx - 3, my], [mx + 3, my - 0.5]], 1.8, ink));
        break;
      case "o":
        mouth.push(ellipse("mouth", mx, my + 1, 2.8, 3.4, mouthFill));
        break;
      case "grin":
        mouth.push(shape("mouth", [[mx - 5, my - 1], [mx + 5, my - 1], [mx + 3.5, my + 3], [mx, my + 4.5], [mx - 3.5, my + 3]], mouthFill));
        break;
      case "open":
        if (m.mouth.open < 0.12) mouth.push(stroke("mouth", [[mx - 4, my - 1], [mx, my + 1.5], [mx + 4, my - 1]], 1.8, ink));
        else mouth.push(ellipse("mouth", mx, my + 1, 3.5, 0.5 + m.mouth.open * 4.5, mouthFill));
        break;
    }
  }

  // Head accessories.
  const headAcc: Part[] = [];
  if (rig.accessories.includes("glasses")) {
    const circle = (c: Pt, r: number): Pt[] => Array.from({ length: 13 }, (_, i) => [c[0] + r * Math.cos((i / 12) * TAU), c[1] + r * Math.sin((i / 12) * TAU)] as Pt);
    const [nx, ny] = eyeAt(true);
    const [fx, fy] = eyeAt(false);
    headAcc.push(stroke("accessory", circle([nx, ny], 6), 1.8, ink), stroke("accessory", circle([fx, fy], 5), 1.8, ink));
    headAcc.push(stroke("accessory", [[nx + 6, ny], [fx - 5, fy]], 1.8, ink), stroke("accessory", [[nx - 6, ny], [hx - hrx * 0.25, ny - 1]], 1.8, ink));
  }
  if (rig.accessories.includes("hat")) {
    const apex: Pt = [hx - hrx * 0.15, hy - hry - 24];
    headAcc.push(shape("accessory", [[hx - hrx * 0.45, hy - hry * 0.78], [hx + hrx * 0.3, hy - hry * 0.92], apex], rig.colours.accent));
    headAcc.push(ellipse("accessory", apex[0], apex[1], 3.5, 3.5, rig.colours.belly));
  }
  if (rig.accessories.includes("bow")) {
    const [bx, by] = [hx - hrx * 0.55, hy - hry * 0.7];
    headAcc.push(shape("accessory", [[bx, by], [bx - 9, by - 6], [bx - 9, by + 6]], rig.colours.accent), shape("accessory", [[bx, by], [bx + 9, by - 6], [bx + 9, by + 6]], rig.colours.accent));
    headAcc.push(ellipse("accessory", bx, by, 3, 3, shade(rig.colours.accent, 0.15)));
  }

  // Head tilt around the neck.
  const pivot: Pt = [hx - hrx * 0.3, hy + hry * 0.6];
  const tiltHead = (p: Part) => mapPart(p, (q) => rotate(q, pivot, -m.head.tilt), -m.head.tilt);
  const headGroupBehind = behindHead.map(tiltHead);
  const headGroup = [...head, ...headParts, ...snout, ...eyes, ...mouth, ...headAcc].map(tiltHead);

  const marks: Part[] = [];
  if (m.mark) {
    marks.push({ kind: "mark", role: "mark", glyph: m.mark.glyph, x: hx + hrx * 0.9 + 6, y: hy - hry - 6 + m.mark.bob, size: 24, colour: ink });
  }

  const figure = [...back, ...headGroupBehind, ...bodyParts, ...front, ...neckParts, ...headGroup, ...arms, ...marks];

  // Whole-body lean and lift.
  const centre: Pt = [bcx, bcy];
  const moved = figure.map((p) => mapPart(p, (q) => add(rotate(q, centre, -m.tilt), [m.dx, -m.lift]), p.kind === "mark" ? 0 : -m.tilt));
  const shadowW = (quad ? brx * 1.25 : brx * 1.15) * (1 - m.lift / 90);
  const shadow = ellipse("shadow", m.dx, 0, shadowW, 4, "rgba(0,0,0,0.16)");
  return [shadow, ...moved].map(roundPart);
}
