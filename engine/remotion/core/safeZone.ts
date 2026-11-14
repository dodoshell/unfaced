/** A rectangle in pixels on the 1080×1920 frame. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FRAME = { width: 1080, height: 1920 } as const;

/**
 * Margins kept clear of the platform UI (Reels, TikTok and Shorts): the
 * caption and buttons at the bottom, the action column on the right, the
 * header at the top. Text must stay inside.
 */
export const SAFE_ZONE = { top: 220, bottom: 380, left: 60, right: 140 } as const;

export function isInsideSafeZone(rect: Rect): boolean {
  return (
    rect.x >= SAFE_ZONE.left &&
    rect.y >= SAFE_ZONE.top &&
    rect.x + rect.w <= FRAME.width - SAFE_ZONE.right &&
    rect.y + rect.h <= FRAME.height - SAFE_ZONE.bottom
  );
}
