import { useId } from "react";
import { FigureFrame, type FigureProps, type Part, plainPart } from "../../../../engine/remotion/kit/index.js";
import { colour, inkColour } from "./layout.js";
import { darkSheet, FONT, luma, mix, PIGMENT_SIZE, PIGMENT_TILE } from "./shared.js";

/** Small details painted on afterwards with a fine brush, on top of the washes and without their wobble. */
const DETAIL = new Set(["eye", "eye-shine", "nose", "mouth", "brow", "mark"]);

const fillOf = (p: Part): string => (p.kind === "stroke" || p.kind === "mark" ? p.colour : p.fill);

/** White parts (clouds, a belly) are the paper left bare, with a pale cool wash for their shade. */
const SHADE_OF_WHITE = "#9DB5D3";

/**
 * Characters and the demo's park painted in watercolour: every part a wash of its colour,
 * a little lighter than the flat colour, with a darker edge where the pigment pools and
 * uneven, granulating pigment inside. Edges wander and blur slightly. Eyes, mouths and line
 * work are painted on top with a fine brush.
 */
export const Figure: React.FC<FigureProps> = ({ parts, palette, ...place }) => {
  const id = `wc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const paper = colour(palette, 0);
  const dark = darkSheet(palette);
  /** Figure units per screen pixel. */
  const px = 100 / place.size;
  const washes = parts.filter((p) => !DETAIL.has(p.role) && p.role !== "shadow");
  const details = parts.filter((p) => DETAIL.has(p.role));
  const shadow = parts.filter((p) => p.role === "shadow");
  const white = (p: Part) => luma(fillOf(p)) > 238;
  const wash = (p: Part) => {
    const c = fillOf(p);
    if (white(p)) return mix(dark ? c : paper, SHADE_OF_WHITE, 0.14);
    return dark ? c : mix(c, paper, 0.12);
  };
  /** The darker rim where the pigment pooled as it dried; white parts get a soft blue one instead of a grey line. */
  const pooled = (p: Part) => (white(p) ? mix(SHADE_OF_WHITE, paper, 0.25) : mix(wash(p), "#1A1420", 0.24));
  const tile = PIGMENT_SIZE * px;
  return (
    <FigureFrame
      {...place}
      defs={
        <>
          <filter id={`${id}w`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={0.09} numOctaves={2} seed={4} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={Math.min(2.6, 7 * px)} xChannelSelector="R" yChannelSelector="G" result="shape" />
            <feGaussianBlur in="shape" stdDeviation={0.9 * px + 0.25} />
          </filter>
          <filter id={`${id}s`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * px} />
          </filter>
          <filter id={`${id}d`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={0.5 * px} />
          </filter>
          <pattern id={`${id}p`} patternUnits="userSpaceOnUse" width={tile} height={tile}>
            <image href={PIGMENT_TILE} width={tile} height={tile} />
          </pattern>
        </>
      }
    >
      {shadow.map((p, i) => plainPart(p, `s${i}`, { fill: () => mix(colour(palette, 4), paper, 0.35), extra: { opacity: 0.22, filter: `url(#${id}s)` } }))}
      <g filter={`url(#${id}w)`}>
        {washes.map((p, i) => (
          <g key={i}>
            {plainPart(p, "w", { fill: wash, outline: { width: 4 * px + 0.4, colour: pooled(p) }, angular: true })}
            {p.role !== "pattern" && !white(p) && plainPart(p, "p", { fill: () => `url(#${id}p)`, angular: true })}
          </g>
        ))}
      </g>
      <g filter={`url(#${id}d)`}>{details.map((p, i) => plainPart(p, `d${i}`, { fill: p.kind === "mark" ? () => inkColour(palette) : undefined, font: FONT }))}</g>
    </FigureFrame>
  );
};
