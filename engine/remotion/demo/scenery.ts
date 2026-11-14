// The park of the style demo, built from the same parts as characters so each style paints
// it its own way. Every piece is drawn at 1 figure unit = 1 pixel (FigureFrame size 100),
// with its ground point at the placement.
import type { Part } from "../core/character/types.js";

const GRASS = "#7BC950";
const GRASS_DARK = "#5DA83B";
const BARK = "#8B5A2B";
const LEAVES = "#3E9B4F";
const LEAVES_LIGHT = "#5DBB63";
const CLOUD = "#FFFFFF";
const BALL = "#D7E33A";
const SEAM = "#FFFFFF";

/** A piece of scenery and where its ground point goes on screen. */
export interface Prop {
  name: string;
  x: number;
  y: number;
  parts: Part[];
}

const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, role: Part["role"] = "prop"): Part => ({ kind: "ellipse", role, cx, cy, rx, ry, rotate: 0, fill });

/** The lawn from the grass line to the bottom of the frame, with a few tufts. */
function lawn(groundY: number): Part[] {
  const depth = 1920 - groundY + 40;
  const tufts = [-430, -250, -60, 140, 330, 480].map((x, i): Part => ({
    kind: "shape",
    role: "prop",
    points: [
      [x - 18, 40 + (i % 2) * 90],
      [x - 6, 4 + (i % 2) * 90],
      [x + 2, 30 + (i % 2) * 90],
      [x + 12, 0 + (i % 2) * 90],
      [x + 20, 40 + (i % 2) * 90],
    ],
    fill: GRASS_DARK,
  }));
  return [
    { kind: "shape", role: "prop", points: [[-600, 0], [600, 0], [600, depth], [-600, depth]], fill: GRASS },
    ...tufts,
  ];
}

function tree(scale: number): Part[] {
  const s = (n: number) => n * scale;
  return [
    ellipse(0, 0, s(110), s(14), "#000000", "shadow"),
    { kind: "capsule", role: "prop", x1: 0, y1: -s(10), x2: 0, y2: -s(250), r: s(22), fill: BARK },
    ellipse(-s(70), -s(270), s(82), s(70), LEAVES),
    ellipse(s(76), -s(265), s(86), s(72), LEAVES),
    ellipse(0, -s(330), s(118), s(108), LEAVES_LIGHT),
  ];
}

function bush(): Part[] {
  return [ellipse(0, 0, 120, 12, "#000000", "shadow"), ellipse(-55, -45, 70, 50, LEAVES), ellipse(50, -48, 75, 54, LEAVES), ellipse(0, -70, 70, 58, LEAVES_LIGHT)];
}

function cloud(): Part[] {
  return [ellipse(-60, -40, 70, 42, CLOUD), ellipse(50, -42, 80, 48, CLOUD), ellipse(0, -70, 70, 55, CLOUD)];
}

/** Everything behind the dog, back to front. */
export function park(groundY: number): Prop[] {
  return [
    { name: "cloud left", x: 250, y: 470, parts: cloud() },
    { name: "cloud right", x: 820, y: 330, parts: cloud() },
    { name: "lawn", x: 540, y: groundY, parts: lawn(groundY) },
    { name: "tree far", x: 905, y: groundY - 30, parts: tree(0.72) },
    { name: "tree near", x: 175, y: groundY + 10, parts: tree(1) },
    { name: "bush", x: 780, y: groundY + 20, parts: bush() },
  ];
}

/** A tennis ball of radius `r` resting on its ground point, its seam turned by `spin` degrees. */
export function ball(r: number, spin: number): Part[] {
  const a = (spin * Math.PI) / 180;
  const turn = ([x, y]: [number, number]): [number, number] => [x * Math.cos(a) - y * Math.sin(a), -r + x * Math.sin(a) + y * Math.cos(a)];
  const seam = (side: 1 | -1): Part => ({
    kind: "stroke",
    role: "prop",
    points: ([[side * -0.75, -0.62], [side * -0.25, -0.2], [side * -0.25, 0.2], [side * -0.75, 0.62]] as Array<[number, number]>).map(([x, y]) => turn([x * r, y * r])),
    width: r * 0.12,
    colour: SEAM,
    line: false,
  });
  return [ellipse(0, -r, r, r, BALL), seam(1), seam(-1)];
}
