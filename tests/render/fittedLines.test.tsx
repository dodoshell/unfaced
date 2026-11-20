import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FittedLines, slideFont } from "../../engine/remotion/kit/index.js";
import type { SlideBox } from "../../engine/remotion/styles/registry.js";
import type { FittedText } from "../../engine/src/post/fitText.js";

const box: SlideBox = {
  id: "headline", role: "display", text: "Why no faces", accent: { start: 4, end: 12 }, x: 60, y: 200, w: 960, h: 300,
  maxSize: 96, minSize: 40, lineHeight: 1.2, tracking: 0.05, upper: true, color: "#F2F2F2", on: "#101418", readable: "large",
};
const fitted: FittedText = { size: 80, height: 192, lines: [{ text: "Why", width: 150 }, { text: "no faces", width: 400, accent: { start: 0, end: 8 } }] };

describe("FittedLines", () => {
  it("draws the box's lines where the box is, in its role's font, case and tracking, never wrapping", () => {
    const html = renderToStaticMarkup(<FittedLines box={box} fitted={fitted} accentColor="#4F8CFF" />);
    expect(html).toContain("left:60px;top:200px;width:960px;height:300px");
    expect(html).toContain(`font-family:${slideFont("display")}`);
    expect(html).toContain("font-size:80px;line-height:96px;color:#F2F2F2;letter-spacing:0.05em;text-transform:uppercase");
    expect(html.match(/white-space:pre/g)).toHaveLength(2);
    expect(html).toContain(`<span style="font-family:${slideFont("accent")};color:#4F8CFF">no faces</span>`);
  });
});
