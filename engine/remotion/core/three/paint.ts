// Part colours for three.js, which reads rgba() and #RRGGBBAA without their alpha. Pure, so tests can call it.

const RGBA = /^rgba\(\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([\d.]+)(%?)\s*\)$/i;
const HEX8 = /^(#[0-9a-f]{6})([0-9a-f]{2})$/i;

/** A CSS colour split into the colour three.js can read and its alpha, as a material's opacity. */
export function splitAlpha(css: string): { color: string; opacity: number } {
  const rgba = RGBA.exec(css.trim());
  if (rgba) {
    const [, r, g, b, alpha, percent] = rgba;
    return { color: `rgb(${r}, ${g}, ${b})`, opacity: Number(alpha) / (percent ? 100 : 1) };
  }
  const hex8 = HEX8.exec(css.trim());
  if (hex8) return { color: hex8[1]!, opacity: Number.parseInt(hex8[2]!, 16) / 255 };
  return { color: css, opacity: 1 };
}
