// The "who we are" slide: three service cards, each with a drawn icon, its name and one line.
// The words come from slides.md (the headline, the body and the items); boxes.json declares
// where this component draws them, for the checks. Night tech draws the ground and the frame.
import { defineSlides, mix, slideFont, type SlideComponent } from "@unfaced/kit";
import { nightTech } from "../../../../../../catalog/styles/13-night-tech/components/index.js";

/** Monoline icons in a 24 × 24 box: a browser window, a calendar, a pair of code brackets. */
const ICONS = [
  "M3 6.5 C3 5.1 4.1 4 5.5 4 H18.5 C19.9 4 21 5.1 21 6.5 V17.5 C21 18.9 19.9 20 18.5 20 H5.5 C4.1 20 3 18.9 3 17.5 Z M3 8.5 H21 M6 6.3 H6.1 M8.4 6.3 H8.5",
  "M4 7 C4 5.9 4.9 5 6 5 H18 C19.1 5 20 5.9 20 7 V18 C20 19.1 19.1 20 18 20 H6 C4.9 20 4 19.1 4 18 Z M4 10 H20 M8.5 3 V7 M15.5 3 V7 M8.5 14.5 L11 17 L15.5 12.5",
  "M8.5 7 L3.5 12 L8.5 17 M15.5 7 L20.5 12 L15.5 17 M13.5 5 L10.5 19",
];

// Where everything goes on a 1080 × 1350 slide (the same numbers as boxes.json).
const LEFT = 72;
const WIDTH = 936;
const HEADLINE = { y: 236, h: 124, size: 104 };
const BODY = { y: 384, h: 46, size: 30 };
const CARD = { top: 474, h: 196, gap: 22, pad: 36, icon: 96 };

const ServiceCards: SlideComponent = ({ ctx }) => {
  const c = nightTech.colours(ctx.palette);
  const { headline, body, items } = ctx.slide;
  const accent = headline?.accent;
  const face = mix(c.ground, c.ink, 0.04);
  const tile = mix(c.ground, c.accent, 0.2);
  return (
    <>
      {headline && (
        <div style={{ position: "absolute", left: LEFT, top: HEADLINE.y, width: WIDTH, height: HEADLINE.h, display: "flex", alignItems: "flex-end", fontFamily: slideFont("display"), fontSize: HEADLINE.size, lineHeight: 1, letterSpacing: "-0.01em", color: c.ink, whiteSpace: "pre" }}>
          {accent ? (
            <span>
              {headline.text.slice(0, accent.start)}
              <span style={{ fontFamily: slideFont("accent"), color: c.secondary }}>{headline.text.slice(accent.start, accent.end)}</span>
              {headline.text.slice(accent.end)}
            </span>
          ) : (
            headline.text
          )}
        </div>
      )}
      {body.length > 0 && (
        <div style={{ position: "absolute", left: LEFT, top: BODY.y, width: WIDTH, height: BODY.h, fontFamily: slideFont("text"), fontSize: BODY.size, lineHeight: 1.4, color: c.body }}>{body.join(" ")}</div>
      )}
      {items.slice(0, 3).map((item, i) => {
        const y = CARD.top + i * (CARD.h + CARD.gap);
        const textX = LEFT + CARD.pad + CARD.icon + 36;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: LEFT, top: y, width: WIDTH, height: CARD.h, boxSizing: "border-box", borderRadius: 28, backgroundColor: face, border: `1.5px solid ${c.line}` }} />
            <div style={{ position: "absolute", left: LEFT + CARD.pad, top: y + (CARD.h - CARD.icon) / 2, width: CARD.icon, height: CARD.icon, borderRadius: 24, backgroundColor: tile, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={48} height={48} viewBox="0 0 24 24">
                <path d={ICONS[i]} fill="none" stroke={c.secondary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ position: "absolute", left: textX, top: y + 50, width: 640, height: 52, fontFamily: slideFont("text"), fontSize: 40, lineHeight: "52px", color: c.ink, whiteSpace: "nowrap" }}>{item.text}</div>
            {item.second && (
              <div style={{ position: "absolute", left: textX, top: y + 108, width: 640, height: 40, fontFamily: slideFont("text"), fontSize: 28, lineHeight: "40px", color: c.body, whiteSpace: "nowrap" }}>{item.second}</div>
            )}
            <div style={{ position: "absolute", left: LEFT + WIDTH - CARD.pad - 48, top: y + 30, width: 48, height: 30, fontFamily: slideFont("mono"), fontSize: 22, lineHeight: "30px", letterSpacing: "0.08em", color: c.muted, textAlign: "right" }}>{`0${i + 1}`}</div>
          </div>
        );
      })}
    </>
  );
};

export default defineSlides({ services: ServiceCards });
