import { describe, expect, it } from "vitest";
import { resolveChoice } from "../../engine/src/page/resolveChoice.js";
import { stubCatalog } from "./stubCatalog.js";

const pickLast = (options: number[]) => options[options.length - 1]!;

describe("resolveChoice", () => {
  it("returns a fixed number as is", () => {
    expect(resolveChoice("style", 7, stubCatalog, pickLast)).toBe(7);
  });

  it("lets pick choose within a list", () => {
    const seen: number[][] = [];
    const result = resolveChoice("script", [2, 6, 9], stubCatalog, (o) => {
      seen.push(o);
      return 6;
    });
    expect(seen).toEqual([[2, 6, 9]]);
    expect(result).toBe(6);
  });

  it("offers every catalog entry for auto", () => {
    expect(resolveChoice("hook", "auto", stubCatalog, pickLast)).toBe(15);
  });

  it("treats a missing field like auto", () => {
    expect(resolveChoice("ending", undefined, stubCatalog, pickLast)).toBe(6);
  });

  it("rejects a pick outside the offered options", () => {
    expect(() => resolveChoice("script", [2, 6], stubCatalog, () => 3)).toThrow(/3/);
  });
});
