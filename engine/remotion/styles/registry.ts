import type React from "react";
import type { Rect } from "../core/safeZone.js";
import type { Scene } from "../../src/plan/types.js";
import type { FigureProps } from "../core/character/svg.js";
import type { Brand } from "../../src/page/types.js";
import type { FittedText } from "../../src/post/fitText.js";
import type { FrameWords } from "../../src/post/frameWords.js";
import type { GroundFamily } from "../../src/post/palette.js";
import type { PostFormat, Slide, SlideKind } from "../../src/post/types.js";

/** A rectangle a style draws text in, named so checks can report it. */
export interface TextBox extends Rect {
  id: string;
}

/** The four kinds of type a slide style uses; a brand font replaces the style's for its role. */
export type FontRole = "display" | "accent" | "text" | "mono";

/**
 * A text box on a slide, with the text and how to fit it (see fitText). A cover's headline box
 * has the id "headline": the cover-crop check holds it inside the format's coverArea.
 */
export interface SlideBox extends TextBox {
  role: FontRole;
  text: string;
  /** Indices into `text`; drawn in the accent font. */
  accent?: { start: number; end: number };
  maxSize: number;
  minSize: number;
  lineHeight: number;
  maxLines?: number;
  /** Extra spacing per character, in em. */
  tracking?: number;
  upper?: boolean;
  /** Evens out the lines (see fitText's `balance`), for headlines. */
  balance?: boolean;
  color: string;
  /** The colour under the text, for the contrast check. */
  on: string;
  /** "body" text must reach 4.5:1 against `on`, "large" text 3:1. */
  readable: "body" | "large";
}

/** What a slide style lays out and draws one slide from. */
export interface SlideContext {
  slide: Slide;
  /** The number of slides in the post. */
  total: number;
  format: PostFormat;
  palette: string[];
  brand: Brand;
  label?: string;
  /** The frame's words in the page's language. */
  words: FrameWords;
  /**
   * The brand logo's path in the render's public folder (brand/logo.svg or brand/logo.png), for
   * staticFile(); set when the brand has a logo. Draw it from here, never from `brand.logo`,
   * which is the path as page.yaml writes it.
   */
  logoFile?: string;
  /**
   * The logo's width over its height, read from the file when the plan is built; the style
   * draws the logo at its own height with this width, so a wide wordmark is not shrunk.
   */
  logoAspect?: number;
}

/** What a style provides to make posts. */
export interface SlideKit {
  /** Font files relative to the style folder. */
  fonts: Record<FontRole, string>;
  /** The slide kinds the style draws so far, while it is being built; every kind when absent. */
  kinds?: SlideKind[];
  /**
   * The lightness family the style's ground keeps (see post/palette.ts): a page background
   * outside it is ignored with a warning. Absent: the page's background always replaces it.
   */
  ground?: GroundFamily;
  /** Where the style puts text on a slide; pure, so plans and checks are built without rendering. */
  layout(ctx: SlideContext): SlideBox[];
  /**
   * Draws a slide; `fitted` holds each box's lines, by box id. On a `custom` slide the post's
   * own component arrives as `custom` (already given its `ctx`): the view draws its frame
   * (label, counter, handle, swipe) and renders `<custom />` where the content goes; the
   * component draws only the content, inside the boxes of custom/boxes.json.
   */
  SlideView: React.FC<{ ctx: SlideContext; fitted: Record<string, FittedText>; custom?: React.FC }>;
}

/** Everything a visual style provides to the composition. */
export interface StyleKit {
  id: number;
  defaultPalette: string[];
  /** Where the style puts text for a scene; pure, so checks can run without rendering. */
  layout(scene: Scene, palette: string[]): TextBox[];
  SceneView: React.FC<{ scene: Scene; palette: string[] }>;
  Background: React.FC<{ palette: string[] }>;
  /** Paints a character's parts (the mascot, the dog in the style demo); see core/character. */
  Figure: React.FC<FigureProps>;
  /** Present when the style makes posts. */
  slides?: SlideKit;
}

const styles = new Map<number, StyleKit>();

export function registerStyle(kit: StyleKit): void {
  styles.set(kit.id, kit);
}

export function getStyle(id: number): StyleKit {
  const kit = styles.get(id);
  if (!kit) {
    const ready = [...styles.keys()].join(", ") || "none";
    throw new Error(`Style ${id} has no components yet; styles with components: ${ready}`);
  }
  return kit;
}
