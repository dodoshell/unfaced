import { FittedLines } from "../../../../../engine/remotion/post/FittedLines.js";
import { Flow } from "../visuals/Flow.js";
import { Headline } from "./Headline.js";
import { boxOf, type KindView, textWidth } from "./kit.js";
import { colours } from "./tokens.js";

/** The steps as a flow of pills, each as wide as its text, its second line in mono at a column to the right. */
export const Steps: KindView<"steps"> = ({ ctx, boxes, fitted, drawing }) => {
  const c = colours(ctx.palette);
  const headline = boxOf(boxes, fitted, "headline");
  const steps = drawing.steps.map((step) => {
    const text = boxOf(boxes, fitted, step.id);
    const second = step.second && boxOf(boxes, fitted, step.second.id);
    const tw = Math.ceil(textWidth(text?.fitted));
    const w = Math.min(step.pill.w, Math.max(Math.round(step.pill.h * 1.6), tw + 2 * step.padX));
    return { ...step, pill: { ...step.pill, w }, text, tw, secondBox: second || undefined };
  });
  return (
    <>
      {headline && <Headline {...headline} accent={c.secondary} />}
      <Flow
        steps={steps.map((s) => ({ pill: s.pill, filled: s.filled, ...(s.secondBox && { second: { x: s.secondBox.box.x } }) }))}
        connectorX={drawing.connectorX}
        palette={ctx.palette}
      />
      {steps.map((s) => (
        <div key={s.id}>
          {s.text && (
            <FittedLines {...s.text} style={{ display: "flex", flexDirection: "column", justifyContent: "center", left: s.pill.x + Math.round((s.pill.w - s.tw) / 2), width: s.tw + 2 }} />
          )}
          {s.secondBox && <FittedLines {...s.secondBox} />}
        </div>
      ))}
    </>
  );
};
