import type React from "react";
import { Img, staticFile } from "remotion";
import { mix } from "../../../../../engine/remotion/core/contrast.js";
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import { colours } from "../slides/tokens.js";
import { Icon } from "./Icon.js";

export interface NotificationProps {
  card: Rect;
  /** The app icon's square, inside the card. */
  icon: Rect;
  palette: string[];
  /** The brand's logo (its public path) for the app icon; a bell on the accent otherwise. */
  logoFile?: string;
  children?: React.ReactNode;
}

/**
 * A notification card, as on a lock screen: the app icon, then the title and text (drawn on top
 * as fitted boxes, or as `children`), with a quieter card stacked behind it.
 */
export const Notification: React.FC<NotificationProps> = ({ card, icon, palette, logoFile, children }) => {
  const c = colours(palette);
  const radius = Math.round(card.h * 0.2);
  const ghost = { x: card.x + Math.round(card.w * 0.05), y: card.y - Math.round(card.h * 0.16), w: Math.round(card.w * 0.9), h: card.h };
  return (
    <>
      <div style={{ position: "absolute", left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h, borderRadius: radius, boxSizing: "border-box", backgroundColor: mix(c.ground, c.ink, 0.03), border: `1px solid ${mix(c.line, c.ground, 0.4)}` }} />
      <div
        style={{
          position: "absolute",
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          borderRadius: radius,
          boxSizing: "border-box",
          backgroundColor: c.surface,
          border: `1px solid ${c.line}`,
          boxShadow: `0 ${Math.round(card.h * 0.12)}px ${Math.round(card.h * 0.4)}px ${mix(c.ground, "#000000", 0.5)}`,
        }}
      />
      <div style={{ position: "absolute", left: icon.x, top: icon.y, width: icon.w, height: icon.h, borderRadius: Math.round(icon.w * 0.26), backgroundColor: logoFile ? c.ink : c.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoFile ? <Img src={staticFile(logoFile)} style={{ width: "72%", height: "72%", objectFit: "contain" }} /> : <Icon name="bell" size={icon.w * 0.56} color="#FFFFFF" stroke={Math.max(2, icon.w / 22)} />}
      </div>
      {children}
    </>
  );
};
