import { describe, expect, it } from "vitest";
import { postPalette } from "../../engine/src/post/palette.js";

const night = { name: "Night tech", defaultPalette: ["#0B1020", "#2F6BFF", "#5B8CFF", "#2F9E6A", "#E8ECF7"], ground: "dark" as const };

describe("postPalette", () => {
  it("keeps the style's palette when the page has none", () => {
    expect(postPalette(night, undefined)).toEqual({ palette: night.defaultPalette, warnings: [] });
  });

  it("takes a dark page background and the page's ink with it", () => {
    const page = ["#0A0A0F", "#7C5CFF", "#B9A6FF", "#34D399", "#F4F4F5"];
    expect(postPalette(night, page)).toEqual({ palette: page, warnings: [] });
  });

  it("keeps its dark ground and ink for a light background, takes roles 1–3, and says so", () => {
    const { palette, warnings } = postPalette(night, ["#f7f5f0", "#1F4FFF", "#E2554F", "#2F9E6A", "#111111"]);
    expect(palette).toEqual(["#0B1020", "#1F4FFF", "#E2554F", "#2F9E6A", "#E8ECF7"]);
    expect(warnings).toEqual([
      "Night tech keeps its dark ground; palette background #F7F5F0 ignored",
      "Night tech keeps the ink that reads on its ground; palette ink #111111 ignored",
    ]);
  });

  it("fills a short palette from the style's, and draws the line at a luminance of 0.2", () => {
    expect(postPalette(night, ["#FFFFFF", "#FF0055"]).palette).toEqual(["#0B1020", "#FF0055", "#5B8CFF", "#2F9E6A", "#E8ECF7"]);
    expect(postPalette(night, ["#777777"]).palette[0]).toBe("#777777"); // luminance 0.18
    expect(postPalette(night, ["#7C7C7C"]).palette[0]).toBe("#0B1020"); // luminance 0.20
  });

  it("lets every page colour replace its role in a style without a ground family", () => {
    const { ground: _ground, ...plain } = night;
    expect(postPalette(plain, ["#FFFFFF"])).toEqual({ palette: ["#FFFFFF", ...night.defaultPalette.slice(1)], warnings: [] });
  });
});
