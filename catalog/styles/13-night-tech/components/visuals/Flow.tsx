import type React from "react";
import type { Rect } from "../../../../../engine/remotion/core/safeZone.js";
import { colours } from "../slides/tokens.js";
import { Chip } from "./Chip.js";

export interface FlowProps {
  /** Each step's pill (as wide as its text) and, when it has one, where its second line starts. */
  steps: { pill: Rect; filled: boolean; second?: { x: number } }[];
  /** Where the arrows between pills run. */
  connectorX: number;
  palette: string[];
}

/**
 * A step flow, top to bottom: pills joined by thin arrows, filled with the accent or outlined,
 * and a dashed leader from each pill to its second line. The step texts go on top.
 */
export const Flow: React.FC<FlowProps> = ({ steps, connectorX, palette }) => {
  const c = colours(palette);
  const stroke = 3;
  return (
    <>
      {steps.map(({ pill, filled, second }, i) => {
        const next = steps[i + 1];
        const cy = pill.y + pill.h / 2;
        return (
          <div key={i}>
            <Chip x={pill.x} y={pill.y} w={pill.w} h={pill.h} fill={filled ? c.accent : c.ground} {...(!filled && { stroke: c.secondary })} />
            {next && <Arrow x={connectorX} from={pill.y + pill.h + 8} to={next.pill.y - 8} color={c.body} width={stroke} />}
            {second && second.x - 20 > pill.x + pill.w + 18 && (
              <div style={{ position: "absolute", left: pill.x + pill.w + 18, top: cy - 1, width: second.x - 20 - (pill.x + pill.w + 18), height: 0, borderTop: `2px dashed ${c.line}` }} />
            )}
          </div>
        );
      })}
    </>
  );
};

/** A thin downward arrow from `from` to `to` at `x`. */
const Arrow: React.FC<{ x: number; from: number; to: number; color: string; width: number }> = ({ x, from, to, color, width }) => {
  const h = to - from;
  if (h < 8) return null;
  const head = Math.min(11, h / 2.5);
  return (
    <svg width={2 * head + 4} height={h} style={{ position: "absolute", left: x - head - 2, top: from, overflow: "visible" }}>
      <path d={`M ${head + 2} 0 V ${h} M 2 ${h - head} L ${head + 2} ${h} L ${2 * head + 2} ${h - head}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
