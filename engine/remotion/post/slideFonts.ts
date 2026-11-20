// Pure, so Node code (renderPost) and the compositions agree on font names and files without React.
import type { Slide } from "../../src/post/types.js";
import type { FontRole } from "../styles/registry.js";

export const SLIDE_FONT_ROLES: FontRole[] = ["display", "accent", "text", "mono"];

/** The CSS font family a slide draws `role` in: the brand's file where it has one, the style's otherwise. */
export const slideFont = (role: FontRole): string => `unfaced-slide-${role}`;

const extension = (file: string): string => /\.[^./\\]+$/.exec(file)?.[0]?.toLowerCase() ?? "";

/** Where a post render's public folder holds the font for `role`: fonts/<role> with the file's extension. */
export function slideFontFile(role: FontRole, file: string): string {
  return `fonts/${role}${extension(file)}`;
}

/** Where a post render's public folder holds the brand's logo: brand/logo with the file's extension, however page.yaml writes the path. */
export function slideLogoFile(logo: string): string {
  return `brand/logo${extension(logo)}`;
}

/** Where a post render's public folder holds an image slide's photo: photos/slide-NN with the file's extension. */
export function slidePhotoFile(slide: Slide): string {
  return `photos/slide-${String(slide.index + 1).padStart(2, "0")}${extension(slide.attrs.photo ?? "")}`;
}
