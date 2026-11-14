// Colour contrast, pure so layouts and tests can use it without rendering.

const HEX = /^#[0-9a-f]{6}$/i;

/** Whether `colour` is written #RRGGBB. */
export const isHex = (colour: string): boolean => HEX.test(colour);

/** The relative luminance of a #RRGGBB colour, from 0 (black) to 1 (white); 0 for anything else. */
export function luminance(colour: string): number {
  if (!isHex(colour)) return 0;
  const n = Number.parseInt(colour.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** The WCAG contrast ratio of two colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (l1! + 0.05) / (l2! + 0.05);
}
