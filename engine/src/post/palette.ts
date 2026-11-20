// A post's palette: the page's colours on the style's roles (design §5.6). A style keeps its own
// kind of ground: a page background in the same lightness family replaces it, any other is
// ignored with a warning, so a light brand colour never turns a night style into a pale one.
import { luminance, mix } from "../../remotion/core/contrast.js";
import type { SlideColours } from "../../remotion/styles/registry.js";

/** The lightness family of a style's ground. Styles with a light paper ground (14, 16) will add "light". */
export type GroundFamily = "dark";

const IN_FAMILY: Record<GroundFamily, (colour: string) => boolean> = {
  dark: (colour) => luminance(colour) < 0.2,
};

export interface PaletteStyle {
  name: string;
  defaultPalette: string[];
  /** Absent: every page colour replaces its role, the ground too. */
  ground?: GroundFamily;
}

/**
 * The five roles (0 background, 1 accent, 2 secondary, 3 highlight, 4 ink) with the page's colours
 * by position. Roles 1–3 always take the page's. When the style keeps a ground family, the page's
 * background replaces the ground only inside that family, and the page's ink comes with it (the
 * ink is chosen to read on the background); otherwise both stay the style's and a warning says so.
 */
export function postPalette(style: PaletteStyle, page: string[] | undefined): { palette: string[]; warnings: string[] } {
  const own = page ?? [];
  const palette = style.defaultPalette.map((colour, i) => own[i] ?? colour);
  const warnings: string[] = [];
  const background = own[0];
  if (style.ground && background !== undefined && !IN_FAMILY[style.ground](background)) {
    palette[0] = style.defaultPalette[0]!;
    palette[4] = style.defaultPalette[4]!;
    warnings.push(`${style.name} keeps its ${style.ground} ground; palette background ${background.toUpperCase()} ignored`);
    if (own[4] !== undefined) warnings.push(`${style.name} keeps the ink that reads on its ground; palette ink ${own[4].toUpperCase()} ignored`);
  }
  return { palette, warnings };
}

/** Named colours for a full five-colour palette, for a style that does not name its own (SlideKit.colours). */
export function slideColours(palette: string[]): SlideColours {
  const [ground, accent, secondary, highlight, ink] = palette as [string, string, string, string, string];
  return {
    ground,
    accent,
    secondary,
    highlight,
    ink,
    muted: mix(ink, ground, 0.45),
    body: mix(ink, ground, 0.22),
    line: mix(ink, ground, 0.84),
    surface: mix(ground, ink, 0.05),
  };
}
