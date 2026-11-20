import type React from "react";
import { mix } from "../../../../../engine/remotion/core/contrast.js";
import { colours } from "../slides/tokens.js";

export interface PhoneProps {
  x: number;
  y: number;
  w: number;
  h: number;
  palette: string[];
  /** How much of the phone shows from its top; below that it fades into the ground. The whole phone when absent. */
  visible?: number;
  /** The screen's colour. */
  screen: string;
  /** Draws a quiet page on the screen (a bar, lines, a card), for a phone with no text of its own. */
  page?: boolean;
  children?: React.ReactNode;
}

/**
 * A simple phone: a dark body with a thin rim, the screen inset with rounded corners, the camera
 * island on top. A phone taller than its space fades out at the foot, as if standing behind the
 * slide's edge.
 */
export const Phone: React.FC<PhoneProps> = ({ x, y, w, h, palette, visible, screen, page, children }) => {
  const c = colours(palette);
  const rim = Math.max(2, Math.round(w / 120));
  const bezel = Math.round(w * 0.04);
  const radius = Math.round(w * 0.17);
  const mask = visible !== undefined && visible < h ? `linear-gradient(to bottom, #000 0, #000 ${Math.round(visible * 0.55)}px, transparent ${visible}px)` : undefined;
  const sw = w - 2 * bezel;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: visible !== undefined ? Math.min(h, visible) : h, overflow: "hidden", ...(mask && { WebkitMaskImage: mask, maskImage: mask }) }}>
      <div style={{ position: "absolute", inset: 0, height: h, boxSizing: "border-box", borderRadius: radius, backgroundColor: c.surface, border: `${rim}px solid ${c.line}` }} />
      <div
        style={{
          position: "absolute",
          left: bezel,
          top: bezel,
          width: sw,
          height: h - 2 * bezel,
          borderRadius: radius - bezel,
          background: `linear-gradient(170deg, ${mix(screen, c.accent, 0.1)} 0%, ${screen} 45%)`,
        }}
      />
      <div style={{ position: "absolute", left: (w - w * 0.3) / 2, top: bezel + Math.round(w * 0.04), width: w * 0.3, height: Math.round(w * 0.075), borderRadius: w, backgroundColor: c.ground }} />
      {page && <ScreenPage x={bezel} y={bezel} w={sw} palette={palette} />}
      {children}
    </div>
  );
};

/** A quiet web page on the screen: a heading bar, a few lines, an accent button and a card. */
const ScreenPage: React.FC<{ x: number; y: number; w: number; palette: string[] }> = ({ x, y, w, palette }) => {
  const c = colours(palette);
  const pad = Math.round(w * 0.11);
  const line = (top: number, width: number, colour: string, height = Math.round(w * 0.035)) => (
    <div style={{ position: "absolute", left: x + pad, top: y + top, width: width * (w - 2 * pad), height, borderRadius: height, backgroundColor: colour }} />
  );
  const u = w / 100;
  return (
    <>
      {line(26 * u, 0.62, mix(c.ink, c.ground, 0.25), Math.round(6.5 * u))}
      {line(37 * u, 0.86, c.line)}
      {line(44 * u, 0.7, c.line)}
      <div style={{ position: "absolute", left: x + pad, top: y + 54 * u, width: 34 * u, height: 10 * u, borderRadius: 10 * u, backgroundColor: c.accent }} />
      <div style={{ position: "absolute", left: x + pad, top: y + 72 * u, width: w - 2 * pad, height: 46 * u, borderRadius: 7 * u, backgroundColor: mix(c.surface, c.ink, 0.04), border: `1px solid ${c.line}` }} />
      {line(126 * u, 0.8, c.line)}
      {line(133 * u, 0.55, c.line)}
    </>
  );
};
