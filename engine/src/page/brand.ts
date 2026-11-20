import { statSync } from "node:fs";
import { extname, join } from "node:path";
import { PageError } from "./loadPage.js";
import type { Page } from "./types.js";

const FONT_EXTENSIONS = [".ttf", ".otf", ".woff"];
const LOGO_EXTENSIONS = [".svg", ".png"];

/**
 * The brand's font and logo files, as absolute paths (only those the page names). Throws a
 * PageError naming the field for a file that is missing or of a kind posts cannot use.
 */
export function checkBrandFiles(page: Page): string[] {
  const brand = page.brand;
  if (!brand) return [];
  const files: { field: string; path: string; allowed: string[]; hint: string }[] = [];
  for (const [role, path] of Object.entries(brand.fonts ?? {})) {
    if (path) files.push({ field: `brand.fonts.${role}`, path, allowed: FONT_EXTENSIONS, hint: "use .ttf, .otf or .woff" });
  }
  if (brand.logo) files.push({ field: "brand.logo", path: brand.logo, allowed: LOGO_EXTENSIONS, hint: "use .svg or .png" });

  const found: string[] = [];
  for (const { field, path, allowed, hint } of files) {
    if (!allowed.includes(extname(path).toLowerCase())) {
      throw new PageError(field, `${field}: ${path} is not a supported file; ${hint}`);
    }
    const absolute = join(page.dir, path);
    let isFile = false;
    try {
      isFile = statSync(absolute).isFile();
    } catch {
      // missing or unreadable: reported below
    }
    if (!isFile) throw new PageError(field, `${field}: ${path} is missing or not a readable file (looked for ${absolute}); ${hint}`);
    found.push(absolute);
  }
  return found;
}
