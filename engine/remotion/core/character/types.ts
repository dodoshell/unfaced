// The shared character system. Every style draws characters (the page's mascot, the dog
// in the style demo) from the same parts, so a pose looks and moves the same in every
// style; only the painting changes. See ./parts.ts for the geometry.

/** The poses and expressions every style can show. */
export const POSES = ["idle", "walk", "run", "jump", "point", "talk", "surprised", "happy", "sad", "thinking"] as const;
export type Pose = (typeof POSES)[number];

export const SPECIES = ["cat", "dog", "fox", "bear", "bunny", "bird", "person", "blob"] as const;
export type Species = (typeof SPECIES)[number];

export const ACCESSORIES = ["glasses", "hat", "scarf", "bow", "collar"] as const;
export type Accessory = (typeof ACCESSORIES)[number];

/** A parametric character: body shape, head, ears or hair, colours and accessories. */
export interface Rig {
  species: Species;
  /** Four legs (side view, like a dog) or two legs and two arms. */
  build: "quadruped" | "biped";
  body: "round" | "long" | "tall";
  head: "round" | "wide" | "tall";
  ears: "none" | "pointy" | "floppy" | "round" | "long";
  tail: "none" | "thin" | "fluffy" | "short";
  hair: "none" | "tuft" | "bob" | "spiky";
  snout: "none" | "short" | "long" | "beak";
  pattern: "none" | "spots" | "stripes";
  colours: {
    body: string;
    belly: string;
    /** Ear insides, nose, pattern and accessories. */
    accent: string;
    /** The head and hands when they differ from the body (a person's skin). */
    head?: string;
    /** Legs when they differ from the body (a person's trousers). */
    legs?: string;
    /** Hair; defaults to the accent colour. */
    hair?: string;
    /** Eyes, mouth and other line work. */
    ink?: string;
  };
  accessories: Accessory[];
}

/**
 * What the parts are, so a style can paint each one its own way. The order of a
 * part list is the drawing order (back to front).
 */
export type Role =
  | "shadow"
  | "tail"
  | "leg-far"
  | "arm-far"
  | "ear-far"
  | "body"
  | "belly"
  | "pattern"
  | "leg"
  | "head"
  | "ear"
  | "ear-inner"
  | "hair"
  | "muzzle"
  | "cheek"
  | "eye"
  | "eye-shine"
  | "nose"
  | "mouth"
  | "brow"
  | "beak"
  | "accessory"
  | "arm"
  | "hand"
  | "mark"
  | "prop";

/**
 * Parts are drawn in figure units: the ground point under the character is (0, 0),
 * y grows downwards, the character faces right (+x) and stands about 100 units tall.
 */
export interface EllipsePart {
  kind: "ellipse";
  role: Role;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Degrees, clockwise. */
  rotate: number;
  fill: string;
}

/** A thick line with round ends from (x1, y1) to (x2, y2): a leg or an arm. */
export interface CapsulePart {
  kind: "capsule";
  role: Role;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r: number;
  fill: string;
}

/** An open line through the points: a closed eye, a mouth, a brow, a thin tail. */
export interface StrokePart {
  kind: "stroke";
  role: Role;
  points: Array<[number, number]>;
  width: number;
  colour: string;
  /** Line work (eyes, mouth, brows, glasses) rather than part of the body (a tail, stripes). */
  line: boolean;
}

/** A closed polygon: a pointed ear, a beak, a hat. */
export interface ShapePart {
  kind: "shape";
  role: Role;
  points: Array<[number, number]>;
  fill: string;
}

/** A symbol above the head ("!" when surprised, "?" when thinking); `y` is its baseline. */
export interface MarkPart {
  kind: "mark";
  role: "mark";
  glyph: "!" | "?";
  x: number;
  y: number;
  size: number;
  colour: string;
}

export type Part = EllipsePart | CapsulePart | StrokePart | ShapePart | MarkPart;

/** Every part of every pose stays inside this box (figure units), so a style can draw into a fixed view box. */
export const FIGURE_BOX = { left: -80, right: 80, top: -170, bottom: 6 } as const;
