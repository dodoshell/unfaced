// Pure, so Node code (renderPost) and the compositions agree on font names and files without React.
import type { FontRole } from "../styles/registry.js";

export const SLIDE_FONT_ROLES: FontRole[] = ["display", "accent", "text", "mono"];

/** The CSS font family a slide draws `role` in: the brand's file where it has one, the style's otherwise. */
export const slideFont = (role: FontRole): string => `unfaced-slide-${role}`;

/** Where a post render's public folder holds the font for `role`: fonts/<role> with the file's extension. */
export function slideFontFile(role: FontRole, file: string): string {
  const ext = /\.[^./\\]+$/.exec(file)?.[0]?.toLowerCase() ?? "";
  return `fonts/${role}${ext}`;
}
