import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Chip } from "../visuals/Chip.js";
import { Notification } from "../visuals/Notification.js";
import { Phone } from "../visuals/Phone.js";
import { Headline } from "./Headline.js";
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import { boxOf, type KindView, lineHeight, textWidth } from "./kit.js";
import { chipFill, chipParts, messageFill, screenFill } from "./layout.js";
import { colours } from "./tokens.js";

/** The card's height around its text as fitted (the boxes leave room for two lines of text), and never shorter than its icon needs. */
function notificationHeight(card: Rect, icon: Rect, title?: ReturnType<typeof boxOf>, text?: ReturnType<typeof boxOf>): number {
  const pad = icon.y - card.y;
  const bottom = text ? text.box.y + text.fitted.height : title ? title.box.y + title.fitted.height : icon.y + icon.h;
  return Math.min(card.h, Math.max(icon.h + 2 * pad, Math.round(bottom - card.y + pad * 0.9)));
}

const middle = { display: "flex", flexDirection: "column", justifyContent: "center" } as const;

/**
 * The cover: a large headline standing on the seam two thirds down, the subtitle hanging under it.
 * With a visual the seam rises and the visual fills the space below: a phone with chips around
 * it, a phone with a short text on its screen, or a notification card.
 */
export const Cover: KindView<"cover"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const subtitle = boxOf(boxes, fitted, "subtitle");
  const visual = drawing.visual;
  const screen = visual?.type === "phone" && visual.screen ? boxOf(boxes, fitted, visual.screen) : undefined;
  const title = boxOf(boxes, fitted, "notification-title");
  const text = boxOf(boxes, fitted, "notification-text");
  return (
    <>
      {visual && (visual.type === "chips" || visual.type === "phone") && (
        <Phone {...visual.phone} palette={ctx.palette} visible={visual.fade} screen={screenFill(ctx.palette)} page={visual.type === "chips"} />
      )}
      {screen && visual?.type === "phone" && visual.card && (
        <>
          <div style={{ position: "absolute", left: visual.card.x, top: visual.card.y, width: visual.card.w, height: screen.fitted.height + 2 * visual.card.pad + lineHeight(screen.fitted) * 0.9, borderRadius: Math.round(visual.card.pad * 0.9), backgroundColor: messageFill(ctx.palette), border: `1px solid ${c.line}` }} />
          <div style={{ position: "absolute", left: visual.card.x + visual.card.pad, top: visual.card.y + visual.card.pad + screen.fitted.height + lineHeight(screen.fitted) * 0.3, width: Math.round(visual.card.w * 0.3), height: Math.max(4, Math.round(lineHeight(screen.fitted) * 0.22)), borderRadius: 8, backgroundColor: c.accent }} />
          <FittedLines {...screen} />
        </>
      )}
      {visual?.type === "chips" &&
        visual.chips.map((chip) => {
          const label = boxOf(boxes, fitted, chip.id);
          if (!label) return null;
          const { pad, icon, gap } = chipParts(chip.h);
          const w = pad + icon + gap + Math.ceil(textWidth(label.fitted)) + pad;
          const x = chip.side === "right" ? chip.anchor : chip.anchor - w;
          const tint = chip.mark === "bad" ? c.bad : chip.mark === "good" ? c.highlight : c.accent;
          const name = chip.mark === "bad" ? "cross" : chip.mark === "good" ? "check" : "arrow";
          return (
            <div key={chip.id}>
              <Chip x={x} y={chip.y} w={w} h={chip.h} fill={chipFill(ctx.palette, chip.mark)} stroke={tint} icon={{ name, color: tint, size: icon, pad }} />
              <FittedLines {...label} {...(chip.side === "left" && { align: "right" as const })} style={middle} />
            </div>
          );
        })}
      {visual?.type === "notification" && (
        <Notification card={{ ...visual.card, h: notificationHeight(visual.card, visual.icon, title, text) }} icon={visual.icon} palette={ctx.palette} {...(ctx.logoFile && { logoFile: ctx.logoFile })}>
          {title && <FittedLines {...title} />}
          {text && <FittedLines {...text} />}
        </Notification>
      )}
      {headline && <Headline {...headline} accent={c.secondary} />}
      {subtitle && <FittedLines {...subtitle} />}
    </>
  );
};
